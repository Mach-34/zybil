contract Zybil {
    use dep::std;

    #[aztec(private)]
    fn constructor() {}

    unconstrained fn verify_signature() -> bool {
        true
    }
}
