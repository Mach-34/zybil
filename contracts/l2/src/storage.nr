use dep::aztec::context::Context;
use dep::aztec::state_vars::{
    map::Map,
    set::Set,
    singleton::Singleton,
    public_state::PublicState,
};
use dep::aztec::types::type_serialization::field_serialization::{
    FieldSerializationMethods,
    FIELD_SERIALIZED_LEN
};
use dep::address_note::address_note::{
    AddressNote,
    AddressNoteMethods,
    ADDRESS_NOTE_LEN,
};
use crate::types::{
    stamp_note::{ StampNote, StampNoteMethods, STAMP_SERIALIZED_NOTE_LEN },
};

mod StorageSlots {
    global BACKEND_ID = 1;
    global STAMP_TYPE_ID = 2;
    global STAMPS_ID = 3;
}

struct Storage {
    // backend: PublicState<AddressNote, ADDRESS_NOTE_LEN>,
    stamp_type: Map<PublicState<Field, FIELD_SERIALIZED_LEN>>,
    stamps: Map<Set<StampNote, STAMP_SERIALIZED_NOTE_LEN>>
}

impl Storage {
    fn init(context: Context) -> Self {
        Storage {
            // backend: PublicState::new(
            //     context,
            //     StorageSlots::BACKEND_ID,
            //     AddressNoteMethods
            // ),
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
            )
        }
    }
}