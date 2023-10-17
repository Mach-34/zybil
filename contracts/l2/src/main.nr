mod storage;
mod types;
mod util;

contract Zybil {
    use dep::aztec::{
        context::Context,
        hash::compute_secret_hash,
        state_vars::public_state::PublicState,
        types::type_serialization::field_serialization::{
            FieldSerializationMethods, FIELD_SERIALIZED_LEN
        },
        types::address::{AztecAddress, EthereumAddress},
        selector::compute_selector,
    };
    use crate::util::get_ens_stamp_private_content_hash;

    // struct Pubkey {
    //     x: Field,
    //     y: Field
    // }

    #[aztec(private)]
    fn constructor() {
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



    // unconstrained fn verify_signature(pubkey: Pubkey, signature: [u8; 64], msg: [u8]) -> bool {
    //     // std::schnorr::verify_signature(pubkey.x, pubkey.y, signature, msg)
    //     true
    // }
}
