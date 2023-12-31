use dep::aztec::{
    context::PrivateContext,
    log::emit_encrypted_log,
    note::{
        note_header::NoteHeader,
        note_interface::NoteInterface,
        utils::compute_note_hash_for_read_or_nullify,
    },
    oracle::{
        get_secret_key::get_secret_key,
        get_public_key::get_public_key,
    }
};

global STAMP_SERIALIZED_NOTE_LEN: Field = 3;

struct StampNote {
    owner: Field,
    // type of stamp
    stamp_type: u8,
    // timestamp of when the stamp was issued
    // timestamp: Field,
    data: Field,
    header: NoteHeader
}

impl StampNote {
    pub fn new(owner: Field, stamp_type: u8, data: Field) -> Self {
        Self { owner, stamp_type, data, header: NoteHeader::empty() }
    }

    fn serialize(self) -> [Field; STAMP_SERIALIZED_NOTE_LEN] {
        [
            self.owner,
            self.stamp_type as Field,
            self.data,
        ]
    }

    fn deserialize(preimage: [Field; STAMP_SERIALIZED_NOTE_LEN]) -> Self {
        StampNote {
            owner: preimage[0],
            stamp_type: preimage[1] as u8,
            data: preimage[2],
            header: NoteHeader::empty()
        }
    }

    fn compute_note_hash(self) -> Field {
        dep::std::hash::pedersen(self.serialize())[0]
    }

    fn compute_nullifier(self) -> Field {
        let siloed_note_hash = compute_note_hash_for_read_or_nullify(StampNoteMethods, self);
        let secret = get_secret_key(self.owner);
        dep::std::hash::pedersen([
            siloed_note_hash,
            secret.low,
            secret.high
        ])[0]
    }

    fn set_header(&mut self, header: NoteHeader) {
        self.header = header;
    }

    // Broadcasts the note as an encrypted log on L1.
    pub fn broadcast(self, context: &mut PrivateContext, slot: Field) {
        let encryption_pub_key = get_public_key(self.owner);
        emit_encrypted_log(
            context,
            (*context).this_address(),
            slot,
            encryption_pub_key,
            self.serialize(),
        );
    }
}

fn deserialize(preimage: [Field; STAMP_SERIALIZED_NOTE_LEN]) -> StampNote {
    StampNote::deserialize(preimage)
}

fn serialize(note: StampNote) -> [Field; STAMP_SERIALIZED_NOTE_LEN] {
    note.serialize()
}

fn compute_note_hash(note: StampNote) -> Field {
    note.compute_note_hash()
}

fn compute_nullifier(note: StampNote) -> Field {
    note.compute_nullifier()
}

fn get_header(note: StampNote) -> NoteHeader {
    note.header
}

fn set_header(note: &mut StampNote, header: NoteHeader) {
    note.set_header(header)
}

fn broadcast(context: &mut PrivateContext, slot: Field, note: StampNote) {
    note.broadcast(context, slot);
}

global StampNoteMethods = NoteInterface {
    deserialize,
    serialize,
    compute_note_hash,
    compute_nullifier,
    get_header,
    set_header,
    broadcast
};
