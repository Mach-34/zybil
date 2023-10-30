use dep::aztec::{
    constants_gen::MAX_NOTES_PER_PAGE,
    hash::sha256_to_field,
};
use dep::std::option::Option;
use crate::types::stamp_note::StampNote;

mod STAMP_ID {
    global ETHEREUM: u8 = 0;
    global ENS: u8 = 1;
    global GOOGLE: u8 = 2;
    global DISCORD: u8 = 3;
    global GITHUB: u8 = 4;
}

pub fn get_ens_stamp_private_content_hash(
    secret_redemption_hash: Field,
    name: Field,
    timestamp: Field,
    canceller: Field
) -> Field {
    // 132 = 32 * 4 + 4
    let mut hash_bytes: [u8; 132] = [0; 132];
    let secret_hash_bytes = secret_redemption_hash.to_be_bytes(32);
    let name_bytes = name.to_be_bytes(32);
    let timestamp_bytes = timestamp.to_be_bytes(32);
    let canceller_bytes = canceller.to_be_bytes(32);

    // insert into bytes array
    for i in 0..32 {
        hash_bytes[i + 4] = secret_hash_bytes[i];
        hash_bytes[i + 36] = name_bytes[i];
        hash_bytes[i + 68] = timestamp_bytes[i];
        hash_bytes[i + 100] = canceller_bytes[i];
    }

    // ethers.id("stamp_ens(bytes32,bytes32,uint256,address)").slice(0, 10)
    hash_bytes[0] = 0x5e;
    hash_bytes[1] = 0x8d;
    hash_bytes[2] = 0x7e;
    hash_bytes[3] = 0x7e;

    sha256_to_field(hash_bytes)
}

pub fn filter_eth_address_stamp(notes: [Option<StampNote>; MAX_NOTES_PER_PAGE]) -> [Option<StampNote>; 1] {
    let mut eth_stamp_ret = [Option::none(); 1];
    for i in 0..notes.len() {
        if notes[i].is_some() {
            let stamp = notes[i].unwrap_unchecked();
            if stamp.stamp_type == STAMP_ID::ETHEREUM {
                eth_stamp_ret[0] = notes[i];
            }
        }
    }
    eth_stamp_ret
}