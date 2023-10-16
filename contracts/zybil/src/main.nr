contract Zybil {
    use dep::std;

    struct Pubkey {
        x: Field,
        y: Field
    }

    #[aztec(private)]
    fn constructor() {}

    unconstrained fn verify_signature(pubkey: Pubkey, signature: [u8; 64], msg: [u8]) -> bool {
        // std::schnorr::verify_signature(pubkey.x, pubkey.y, signature, msg)
        true
    }
}
