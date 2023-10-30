mod types;
mod util;

contract Zybil {
    use dep::aztec::{
        constants_gen::{MAX_NOTES_PER_PAGE},
        context::Context,
        hash::{compute_secret_hash, sha256_to_field},
        note::{
            note_viewer_options::NoteViewerOptions,
            note_getter_options::SortOrder,
            note_header::NoteHeader,
            utils as note_utils
        },
        selector::compute_selector,
        types::{
            address::{AztecAddress, EthereumAddress},
            type_serialization::field_serialization::{
                FieldSerializationMethods, FIELD_SERIALIZED_LEN
            },
        },
        oracle::get_public_key::get_public_key,
        log::emit_encrypted_log,
        state_vars::{map::Map, public_state::PublicState, set::Set}
    };
    use crate::{
        types::{
            public_key::{ Pubkey, PubkeyMethods, PUBKEY_SERIALIZED_LEN },
            stamp_note::{ StampNote, StampNoteMethods, STAMP_SERIALIZED_NOTE_LEN }
        },
        util::{
            get_ens_stamp_private_content_hash,
            get_attestation_content_hash,
            filter_eth_address_stamp,
            STAMP_ID,
            STAMP_SCORE
        },
    };
    use dep::std::option::Option;

    global STAMP_SCORES = [
    STAMP_SCORE::ETHEREUM, 
    STAMP_SCORE::ENS, 
    STAMP_SCORE::GOOGLE, 
    STAMP_SCORE::DISCORD, 
    STAMP_SCORE::GITHUB
];

    mod StorageSlots {
        global BACKEND_ID = 1;
        global STAMP_TYPE_ID = 2;
        global STAMPS_ID = 3;
        global SIGNER_ID = 4;
    }

    struct Storage {
        registered_signer: PublicState<Pubkey, PUBKEY_SERIALIZED_LEN>,
        stamp_type: Map<PublicState<Field, FIELD_SERIALIZED_LEN>>,
        stamps: Map<Set<StampNote, STAMP_SERIALIZED_NOTE_LEN>>
    }

    impl Storage {
        fn init(context: Context) -> pub Self {
            Storage {
                registered_signer: PublicState::new(
                    context,
                    StorageSlots::SIGNER_ID,
                    PubkeyMethods
                ),
                stamp_type: Map::new(
                    context,
                    StorageSlots::STAMP_TYPE_ID,
                    |context, slot| PublicState::new(
                        context,
                        slot,
                        FieldSerializationMethods
                    )
                ),
                stamps: Map::new(
                    context,
                    StorageSlots::STAMPS_ID,
                    |context, slot| Set::new(
                        context,
                        slot,
                        StampNoteMethods
                    )
                ),
            }
        }
    }

    #[aztec(private)]
    fn constructor(signer: Pubkey) {
        // Set registered signer
        let selector = compute_selector("initialize(Field,Field)");
        context.call_public_function(context.this_address(), selector, [signer.x, signer.y]);
        // set the backend address based on the sender
        // setup bridge
        // let selector = compute_selector("_initialize((Field))");
        // context.call_public_function(context.this_address(), selector, )
    }

    #[aztec(private)]
    fn stamp_ens(
        redemption_hash: Field,
        name: Field,
        timestamp: Field,
        msg_key: Field,
        consumption_secret: Field
    ) {
        // Retrieve Eth Address from stamps. Use as canceller, will fail if wrong eth address stamped/ provided
        let eth_address = get_eth_address(context.msg_sender());

        // consume L1 to L2 and emit nullifier
        let content_hash = get_ens_stamp_private_content_hash(
            redemption_hash,
            name,
            timestamp,
            eth_address
        );

        // CONSUME L1 MESSAGE TO L2
        context.consume_l1_to_l2_message(msg_key, content_hash, consumption_secret);

        // CREATE NEW ENS STAMP AND STORE IN SET
        let mut stamp = StampNote::new(
            context.msg_sender(),
            STAMP_ID::ENS,
            name
        );     
        storage.stamps.at(context.msg_sender()).insert(&mut stamp, false); 

        // EMIT ENCRYPTED LOG OF STAMP CREATION
        emit_encrypted_log(
            &mut context,
            context.this_address(),
            stamp.header.storage_slot,
            get_public_key(context.msg_sender()),
            stamp.serialize()
        );
    }

    /**
     * Generate a stamp for an Ethereum address by proving a signature over the sender's Aztec Address
     *
     * @param pubkey_x: the X coordinate of the full public key for an secp256k1 key (Ethereum)
     * @param pubkey_y: the Y coordinate of the full public key for an secp256k1 key (Ethereum)
     * @param signature: the signature on the sender's aztec address by given pubkey
     */
    #[aztec(private)]
    fn stamp_ethkey(pubkey_x: [u8; 32], pubkey_y: [u8; 32], signature: [u8; 64]) {
        // convert msg.sender eth signature message format
        let message = format_eth_msg(context.msg_sender());
        // check signature
        let valid_signature = dep::std::ecdsa_secp256k1::verify_signature(
            pubkey_x,
            pubkey_y,
            signature,
            message
        );
        assert(valid_signature);

        // convert pubkey to EthAddress
        let mut pubkey: [u8; 64] = [0; 64];
        for i in 0..32 {
            pubkey[i] = pubkey_x[i];
            pubkey[i + 32] = pubkey_y[i];
        };
        let pubkeyHash = dep::std::hash::keccak256(pubkey, 64);
        let mut address: Field = 0;
        let mut v: Field = 1;
        for i in 0..20 {
            let index = 20 - i;
            address += pubkeyHash[index + 11] as Field * v;
            v *= 256;
        }

        // create stamp
        let mut stamp = StampNote::new(
            context.msg_sender(),
            STAMP_ID::ETHEREUM,
            address
        );
        storage.stamps.at(context.msg_sender()).insert(&mut stamp, false);

        // emit encrypted log of stamp creation
        emit_encrypted_log(
            &mut context,
            context.this_address(),
            stamp.header.storage_slot,
            get_public_key(context.msg_sender()),
            stamp.serialize()
        );
    }

    #[aztec(private)]
    fn attest_l1(caller_on_l1: Field) -> bool {
        // compute merkle root of stamp data
        let root = compute_stamp_merkle_root(context.msg_sender());
        // compute content hash of attestation
        let content_hash = get_attestation_content_hash(root, caller_on_l1);
        // send message to l2 outbox
        context.message_portal(content_hash);
        // return success
        true
    }

    // TODO: Need to nullify stamps 
    #[aztec(private)]
    fn stamp_web2(signature: [u8; 64], msg: [Field; 2]) {
        // Encode msg to bytes
        // let encoded_msg = encode_msg(msg);
        // let Pubkey { x, y } = storage.registered_signer.read();
        // let valid_signature = dep::std::schnorr::verify_signature(x, y, signature, encoded_msg);
        // assert(valid_signature, "Signature could not be verified with provided data");
        let mut stamp = StampNote::new(
            context.msg_sender(),
            msg[0] as u8,
            msg[1]
        );        
        storage.stamps.at(context.msg_sender()).insert(&mut stamp, false);
        
        emit_encrypted_log(
            &mut context,
            context.this_address(),
            stamp.header.storage_slot,
            get_public_key(context.msg_sender()),
            stamp.serialize()
        );
    }

    
    #[aztec(public)]
    internal fn initialize(signer_x: Field, signer_y: Field) {
        storage.registered_signer.write(Pubkey {x: signer_x, y: signer_y});
    }

    unconstrained fn get_eth_address(owner: Field) -> Field {
        let mut address = 0; 
        let options = NoteViewerOptions::new().set_offset(0);
        let notes = storage.stamps.at(owner).view_notes(options);
        let filtered = filter_eth_address_stamp(notes);
        if filtered[0].is_some() {
            let stamp = filtered[0].unwrap_unchecked();
            address = stamp.data;
        }
        address
    }

    unconstrained fn get_score(owner: AztecAddress) -> u8 {
        let options = NoteViewerOptions::new().set_offset(0);
        let notes = storage.stamps.at(owner.address).view_notes(options);
        let mut sum = 0;
        for i in 0..notes.len() {
            if notes[i].is_some() {
                let stamp = notes[i].unwrap_unchecked();
                sum += STAMP_SCORES[stamp.stamp_type - 1];
            }
        }
        sum
    }

    unconstrained fn encode_msg(msg: [Field; 2]) -> [u8; 33] {
        let mut bytes: [u8; 33] = [0; 33]; 
        let data = msg[1].to_be_bytes(32);
        bytes[0] = msg[0] as u8;
        for i in 0..32 {
            bytes[i + 1] = data[i];
        }
        bytes
    }

    unconstrained fn format_eth_msg(owner: Field) ->  [u8; 32] {
        // decompose owner into 8 bit limbs in big endian
        let owner_bytes: [u8] = owner.to_be_bytes(32);

        // construct full message preimage
        let mut bytes: [u8; 60] = [0; 60];
        // prefix = "\x19Ethereum Signed Message:\n"
        let prefix: [u8; 26] = [25,  69, 116, 104, 101, 114, 101, 117, 109,  32,  83, 105, 103, 110, 101, 100,  32,  77, 101, 115, 115, 97, 103, 101,  58,  10];
        for i in 0..26 {
            bytes[i] = prefix[i];
        }

        bytes[26] = 51;
        bytes[27] = 50;
        for i in 0..32 {
            bytes[i + 28] = owner_bytes[i];
        }

        // length of message 
        bytes[26] = 51;
        bytes[27] = 50;
        // message
        for i in 0..32 {
            bytes[i + 28] = owner_bytes[i];
        }

        // return the keccak hash of message
        dep::std::hash::keccak256(bytes, 60)
    }

    unconstrained fn compute_note_hash_and_nullifier(contract_address: Field, nonce: Field, storage_slot: Field, preimage: [Field; STAMP_SERIALIZED_NOTE_LEN]) -> [Field; 4] {
        let note_header = NoteHeader::new(contract_address, nonce, storage_slot);
        note_utils::compute_note_hash_and_nullifier(StampNoteMethods, note_header, preimage)
    }

    unconstrained fn compute_stamp_merkle_root(owner: Field) -> Field {
        let options = NoteViewerOptions::new().sort(1, SortOrder.ASC).set_offset(0);
        let notes = storage.stamps.at(owner).view_notes(options);
        let mut leaf_index = [0; 8];
        // index the notes by stamp type 
        for i in 1..8 {
            if notes[i].is_some() {
                // if note exists, store index to later hash data
                let stamp = notes[i].unwrap_unchecked();
                leaf_index[stamp.stamp_type] = i as Field;
            } else {
                // else store 0 to hash empty value
                leaf_index[i] = 0;
            }
        }
        // create hashes of leaves
        let mut leaves: [Field; 8] = [0; 8];
        let zero_leaf = dep::std::hash::pedersen([0])[0];
        leaves[0] = dep::std::hash::pedersen([owner])[0];
        for i in 1..8 {
            if leaf_index[i] != 0 {
                // if note exists, hash data for leaf
                let note = notes[leaf_index[i]].unwrap_unchecked();
                leaves[i] = dep::std::hash::pedersen([
                    note.owner,
                    note.stamp_type as Field,
                    note.data
                ])[0];
            } else {
                // if note does not exist, use precomputed empty leaf
                leaves[i] = zero_leaf;
            }
        }
        // compute merkle root for tree of depth 4
        let mut level_2: [Field; 4] = [0; 4];
        for i in 0..level_2.len() {
            level_2[i] = dep::std::hash::pedersen([leaves[i * 2], leaves[i * 2 + 1]])[0];
        }
        let mut level_3: [Field; 2] = [0; 2];
        for i in 0..level_3.len() {
            level_3[i] = dep::std::hash::pedersen([level_2[i * 2], level_2[i * 2 + 1]])[0];
        }
        // return merkle root
        dep::std::hash::pedersen([level_3[0], level_3[1]])[0]
    }
}