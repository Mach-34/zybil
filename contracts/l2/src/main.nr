mod types;
mod util;

contract Zybil {
    use dep::aztec::{
        constants_gen::{MAX_NOTES_PER_PAGE},
        context::Context,
        hash::compute_secret_hash,
        note::{
            note_viewer_options::NoteViewerOptions,
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
            STAMP_ID
        },
    };
    use dep::std::option::Option;


    // Largest possible signed message length
    // global MAX_MSG_LEN = 380;


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
        addr: EthereumAddress,
        timestamp: Field,
        canceller: EthereumAddress,
        msg_key: Field,
        consumption_hash: Field,
    ) {
        // todo: constrain to make sure user has proven ownership of eth address
        // consume L1 to L2 and emit nullifier
        let content_hash = get_ens_stamp_private_content_hash(
            redemption_hash,
            addr.address,
            timestamp,
            canceller.address
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
        // convert msg.sender to [u8] as message to be signed
        let message = context.msg_sender().to_be_bytes(32);

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
        // let mut stamp = StampNote::new(
        //     context.msg_sender(),
        //     STAMP_ID::ETHEREUM,
        //     0, // does not expire
        //     [address, 0, 0]
        // );
        // storage.stamps.at(context.msg_sender()).insert(&mut stamp);

        // // emit encrypted log of stamp creation
        // emit_encrypted_log(
        //     &mut context,
        //     context.this_address(),
        //     stamp.header.storage_slot,
        //     get_public_key(context.msg_sender()),
        //     stamp.serialize()
        // );
    }

    unconstrained fn getScore(owner: AztecAddress) -> StampNote {
        let options = NoteViewerOptions::new().set_limit(1);
        let notes = storage.stamps.at(owner.address).view_notes(options);
        notes[0].unwrap()
        // let mut sum = 0;
        // for i in 0..notes.len() {
        //     if notes[i].is_some() {
        //         // let stamp = notes[i].unwrap_unchecked();
        //         sum += 1;
        //     }
        // }
        // sum
    }

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
            [msg[1], 0, 0]
        );        
        storage.stamps.at(context.msg_sender()).insert(&mut stamp);
        
        emit_encrypted_log(
            &mut context,
            context.this_address(),
            stamp.header.storage_slot,
            get_public_key(context.msg_sender()),
            stamp.serialize()
        );
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

    #[aztec(public)]
    internal fn initialize(signer_x: Field, signer_y: Field) {
        storage.registered_signer.write(Pubkey {x: signer_x, y: signer_y});
    }

    unconstrained fn compute_note_hash_and_nullifier(contract_address: Field, nonce: Field, storage_slot: Field, preimage: [Field; STAMP_SERIALIZED_NOTE_LEN]) -> [Field; 4] {
        let note_header = NoteHeader::new(contract_address, nonce, storage_slot);
        note_utils::compute_note_hash_and_nullifier(StampNoteMethods, note_header, preimage)
    }
}
