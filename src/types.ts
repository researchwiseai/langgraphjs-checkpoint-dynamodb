/**
 * Represents an item in the checkpoint system.
 *
 * @interface CheckpointItem
 *
 * @property {string} thread_id - The unique identifier for the thread.
 * @property {string} checkpoint_ns - The namespace of the checkpoint.
 * @property {string} checkpoint_id - The unique identifier for the checkpoint.
 * @property {string} [parent_checkpoint_id] - The optional identifier for the parent checkpoint.
 * @property {string} type - The type of the checkpoint.
 * @property {Uint8Array} checkpoint - The checkpoint data.
 * @property {Uint8Array} metadata - The metadata associated with the checkpoint.
 */
export interface CheckpointItem {
    thread_id: string;
    checkpoint_ns: string;
    checkpoint_id: string;
    parent_checkpoint_id?: string;
    type: string;
    checkpoint: Uint8Array;
    metadata: Uint8Array;
}

/**
 * Represents a configuration that has been validated.
 *
 * @interface ValidatedConfigurable
 * @property {string} thread_id - The unique identifier for the thread.
 * @property {string} checkpoint_ns - The namespace for the checkpoint.
 * @property {string | undefined} checkpoint_id - The unique identifier for the checkpoint, which may be undefined.
 */
export interface ValidatedConfigurable {
    thread_id: string;
    checkpoint_ns: string;
    checkpoint_id: string | undefined;
}
