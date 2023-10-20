mod types;
mod util;

contract Zybil {
    use dep::aztec::{
        context::Context,
        hash::compute_secret_hash,
        selector::compute_selector,
        state_vars::{map::Map, public_state::PublicState, set::Set},
        types::{
            address::{AztecAddress, EthereumAddress},
            type_serialization::field_serialization::{
                FieldSerializationMethods, FIELD_SERIALIZED_LEN
            }
        },
    };
    use crate::{
        types::{
            public_key::{ Pubkey, PubkeyMethods, PUBKEY_SERIALIZED_LEN },
            stamp_note::{ StampNote, StampNoteMethods, STAMP_SERIALIZED_NOTE_LEN }
        },
        util::get_ens_stamp_private_content_hash
    };
    use dep::std::{
        option::Option,
        schnorr
    };

    // Largest possible signed message length
    global MAX_MSG_LEN = 380;

    mod StorageSlots {
        global BACKEND_ID = 1;
        global STAMP_TYPE_ID = 2;
        global STAMPS_ID = 3;
        global SIGNER_ID = 4;
    }

    struct Storage {
    // backend: PublicState<AddressNote, ADDRESS_NOTE_LEN>,
        registered_signer: PublicState<Pubkey, PUBKEY_SERIALIZED_LEN>,
        stamp_type: Map<PublicState<Field, FIELD_SERIALIZED_LEN>>,
        stamps: Map<Set<StampNote, STAMP_SERIALIZED_NOTE_LEN>>
    }

    impl Storage {
        fn init(context: Context) -> pub Self {
            Storage {
                // backend: PublicState::new(
                //     context,
                //     StorageSlots::BACKEND_ID,
                //     AddressNoteMethods
                // ),
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
        secret_redemption_hash: Field,
        addr: EthereumAddress,
        timestamp: Field,
        canceller: EthereumAddress,
        msg_key: Field,
        secret_consumption_hash: Field,
    ) {
        // todo: constrain to make sure user has proven ownership of eth address
        // consume L1 to L2 and emit nullifier
        let content_hash = get_ens_stamp_private_content_hash(
            secret_redemption_hash,
            addr.address,
            timestamp,
            canceller.address
        );
    }

    #[aztec(private)]
    fn stamp_web2(signature: [u8; 64], msg: [u8; MAX_MSG_LEN]) {
        // Ensure signature is valid before storing stamp
        let Pubkey { x, y } = storage.registered_signer.read();
        let valid_signature = schnorr::verify_signature(x, y, signature, msg);
        assert(valid_signature, "Invalid signature");


        // TODO: Need to decode data from message

        let note = StampNote::new(
            context.msg_sender(),
            0, // TODO
            [0, 0, 0]
        );        
        note.insert()
    }

    #[aztec(public)]
    internal fn initialize(signer_x: Field, signer_y: Field) {
        storage.registered_signer.write(Pubkey {x: signer_x, y: signer_y});
    }

    // #[aztec(private)]
    // internal fn valid_signature(signature: [u8; 64], msg: [u8; MAX_MSG_LEN]) -> bool {
    //     let Pubkey { x, y } = storage.registered_signer.read();
    //     schnorr::verify_signature(x, y, signature, msg)
    // }

    unconstrained fn registered_signer() -> Pubkey {
        storage.registered_signer.read()
    }
}
