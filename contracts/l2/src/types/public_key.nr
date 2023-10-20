use dep::aztec::types::type_serialization::TypeSerializationInterface;

global PUBKEY_SERIALIZED_LEN: Field = 2;

struct Pubkey {
    x: Field,
    y: Field
}

impl Pubkey {
    fn new(x: Field, y: Field) -> Self {
        Self { x, y }
    }

    fn deserialize(preimage: [Field; PUBKEY_SERIALIZED_LEN]) -> Self {
        Self { x: preimage[0], y: preimage[1] }
    }

    fn serialize(self) -> [Field; PUBKEY_SERIALIZED_LEN] {
        [
         self.x,
         self.y   
        ]
    }
}

fn deserialize(preimage: [Field; PUBKEY_SERIALIZED_LEN]) -> Pubkey {
    Pubkey::deserialize(preimage)
}

fn serialize(pubkey: Pubkey) -> [Field; PUBKEY_SERIALIZED_LEN] {
    pubkey.serialize()
}



global PubkeyMethods = TypeSerializationInterface {
    deserialize,
    serialize
};