export interface WriteProperties {
    thread_id: string;
    checkpoint_ns: string;
    checkpoint_id: string;
    task_id: string;
    idx: number;
    channel: string;
    type: string;
    value: Uint8Array;
}

export interface DynamoDBWriteItem {
    thread_id_checkpoint_id_checkpoint_ns: string;
    task_id_idx: string;
    channel: string;
    type: string;
    value: Uint8Array;
}

/**
 * The `Write` class represents a write operation to be stored in DynamoDB.
 * It contains various properties related to the write operation and provides
 * methods to convert to and from DynamoDB items.
 *
 * @class
 * @property {string} thread_id - The ID of the thread.
 * @property {string} checkpoint_ns - The namespace of the checkpoint.
 * @property {string} checkpoint_id - The ID of the checkpoint.
 * @property {string} task_id - The ID of the task.
 * @property {number} idx - The index of the write operation.
 * @property {string} channel - The channel of the write operation.
 * @property {string} type - The type of the write operation.
 * @property {Uint8Array} value - The value of the write operation.
 *
 * @constructor
 * @param {Object} WriteProperties - The properties to initialize the `Write` instance.
 * @param {string} WriteProperties.thread_id - The ID of the thread.
 * @param {string} WriteProperties.checkpoint_ns - The namespace of the checkpoint.
 * @param {string} WriteProperties.checkpoint_id - The ID of the checkpoint.
 * @param {string} WriteProperties.task_id - The ID of the task.
 * @param {number} WriteProperties.idx - The index of the write operation.
 * @param {string} WriteProperties.channel - The channel of the write operation.
 * @param {string} WriteProperties.type - The type of the write operation.
 * @param {Uint8Array} WriteProperties.value - The value of the write operation.
 *
 * @method toDynamoDBItem
 * @returns {DynamoDBWriteItem} The DynamoDB item representation of the write operation.
 *
 * @method static fromDynamoDBItem
 * @param {DynamoDBWriteItem} DynamoDBWriteItem - The DynamoDB item to convert.
 * @returns {Write} The `Write` instance created from the DynamoDB item.
 *
 * @method static getPartitionKey
 * @param {Object} params - The parameters to generate the partition key.
 * @param {string} params.thread_id - The ID of the thread.
 * @param {string} params.checkpoint_id - The ID of the checkpoint.
 * @param {string} params.checkpoint_ns - The namespace of the checkpoint.
 * @returns {string} The partition key.
 *
 * @method static separator
 * @returns {string} The separator used in partition keys and other composite keys.
 */
export class Write {
    readonly thread_id: string;
    readonly checkpoint_ns: string;
    readonly checkpoint_id: string;
    readonly task_id: string;
    readonly idx: number;
    readonly channel: string;
    readonly type: string;
    readonly value: Uint8Array;

    constructor({
        thread_id,
        checkpoint_ns,
        checkpoint_id,
        task_id,
        idx,
        channel,
        type,
        value,
    }: WriteProperties) {
        this.thread_id = thread_id;
        this.checkpoint_ns = checkpoint_ns;
        this.checkpoint_id = checkpoint_id;
        this.task_id = task_id;
        this.idx = idx;
        this.channel = channel;
        this.type = type;
        this.value = value;
    }

    toDynamoDBItem(): DynamoDBWriteItem {
        return {
            thread_id_checkpoint_id_checkpoint_ns: Write.getPartitionKey({
                thread_id: this.thread_id,
                checkpoint_id: this.checkpoint_id,
                checkpoint_ns: this.checkpoint_ns,
            }),
            task_id_idx: [this.task_id, this.idx].join(Write.separator()),
            channel: this.channel,
            type: this.type,
            value: this.value,
        };
    }

    static fromDynamoDBItem({
        thread_id_checkpoint_id_checkpoint_ns,
        task_id_idx,
        channel,
        type,
        value,
    }: DynamoDBWriteItem): Write {
        const [thread_id, checkpoint_id, checkpoint_ns] =
            thread_id_checkpoint_id_checkpoint_ns.split(this.separator());
        const [task_id, idx] = task_id_idx.split(this.separator());
        return new Write({
            thread_id,
            checkpoint_ns,
            checkpoint_id,
            task_id,
            idx: parseInt(idx, 10),
            channel,
            type,
            value,
        });
    }

    static getPartitionKey({
        thread_id,
        checkpoint_id,
        checkpoint_ns,
    }: {
        thread_id: string;
        checkpoint_id: string;
        checkpoint_ns: string;
    }): string {
        return [thread_id, checkpoint_id, checkpoint_ns].join(Write.separator());
    }

    static separator() {
        return ':::';
    }
}
