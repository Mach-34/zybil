mod storage;
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

    #[aztec(private)]
    fn constructor() {}
    // fn constructor(signer_x: Field, signer_y: Field) {
        // Set registered signer
        // let selector = compute_selector("initialize(Field,Field)");
        // context.call_public_function(context.this_address(), selector, [signer_x, signer_y]);
        // set the backend address based on the sender
        // setup bridge
        // let selector = compute_selector("_initialize((Field))");
        // context.call_public_function(context.this_address(), selector, )
    // }

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

    #[aztec(private)]
    fn stamp_ethkey(pubkey_x: [u8; 32], pubkey_y: [u8; 32], signature: [u8; 64]) {
        // convert msg.sender to [u8] as message to be signed
        let message = context.msg_sender().to_le_bytes(20);
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
    }

    // #[aztec(private)]
    // fn stamp_web2() {
        
    // }

    // #[aztec(public)]
    // internal fn initialize(signer_x: Field, signer_y: Field) {
    //     storage.registered_signer.write(Pubkey {x: signer_x, y: signer_y});
    // }

    // #[aztec(public)]
    // internal fn valid_signature(signature: [u8; 64], msg: [u8; MAX_MSG_LEN]) -> bool {
    //     let Pubkey { x, y } = storage.registered_signer.read();
    //     schnorr::verify_signature(x, y, signature, msg)
    // }

    // unconstrained fn registered_signer() -> Pubkey {
    //     storage.registered_signer.read()
    // }
}
