// use dep::aztec::context::Context;
// use dep::aztec::state_vars::{map::Map, public_state::PublicState, set::Set};
// use dep::aztec::types::type_serialization::field_serialization::{
//     FieldSerializationMethods, FIELD_SERIALIZED_LEN
// };
// use crate::types::public_key::{Pubkey, PUBKEY_SERIALIZED_LEN, PubkeyMethods};
// use crate::types::stamp_note::{StampNote, STAMP_SERIALIZED_NOTE_LEN, StampNoteMethods};

// mod StorageSlots {
//     global BACKEND_ID = 1;
//     global STAMP_TYPE_ID = 2;
//     global STAMPS_ID = 3;
//     global SIGNER_ID = 4;
// }

// struct Storage {
//     registered_signer: PublicState<Pubkey, PUBKEY_SERIALIZED_LEN>,
//     stamp_type: Map<PublicState<Field, FIELD_SERIALIZED_LEN>>,
//     stamps: Map<Set<StampNote, STAMP_SERIALIZED_NOTE_LEN>>
// }

// impl Storage {
//     fn init(context: Context) -> Self {
//         Storage {
//             registered_signer: PublicState::new(
//                 context,
//                 StorageSlots::SIGNER_ID,
//                 PubkeyMethods
//             ),
//             stamp_type: Map::new(
//                 context,
//                 StorageSlots::STAMP_TYPE_ID,
//                 |context, slot| PublicState::new(
//                     context,
//                     slot,
//                     FieldSerializationMethods
//                 )
//             ),
//             stamps: Map::new(
//                 context,
//                 StorageSlots::STAMPS_ID,
//                 |context, slot| Set::new(
//                     context,
//                     slot,
//                     StampNoteMethods
//                 )
//             ),
//         }
//     }
// }