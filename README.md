# langgraphjs-checkpoint-dynamodb

Implementation of a LangGraph.js CheckpointSaver that uses a AWS's DynamoDB

## Package name

    `@langgraph/checkpoint-dynamodb`

## Inspiration

Guidance and inspiration has been taken from the existing checkpoint savers
(Sqlite and MongoDB) written by the Langgraph JS team.

-   [Sqlite](https://github.com/langchain-ai/langgraphjs/tree/main/libs/checkpoint-sqlite)
-   [MongoDB](https://github.com/langchain-ai/langgraphjs/tree/main/libs/checkpoint-mongodb)

## Required DynamoDB Tables

To be able to use this checkpointer, two DynamoDB table's are needed, one to store
checkpoints and the other to store writes. Below are some examples of how you
can create the required tables.

### Terraform

```hcl
# Variables for table names
variable "checkpoints_table_name" {
  type = string
}

variable "writes_table_name" {
  type = string
}

# Checkpoints Table
resource "aws_dynamodb_table" "checkpoints_table" {
  name         = var.checkpoints_table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "thread_id"
  range_key = "checkpoint_id"

  attribute {
    name = "thread_id"
    type = "S"
  }

  attribute {
    name = "checkpoint_id"
    type = "S"
  }
}

# Writes Table
resource "aws_dynamodb_table" "writes_table" {
  name         = var.writes_table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "thread_id_checkpoint_id_checkpoint_ns"
  range_key = "task_id_idx"

  attribute {
    name = "thread_id_checkpoint_id_checkpoint_ns"
    type = "S"
  }

  attribute {
    name = "task_id_idx"
    type = "S"
  }
}
```

### AWS CDK

```typescript
import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export class DynamoDbStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const checkpointsTableName = 'YourCheckpointsTableName';
        const writesTableName = 'YourWritesTableName';

        // Checkpoints Table
        new dynamodb.Table(this, 'CheckpointsTable', {
            tableName: checkpointsTableName,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'thread_id', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'checkpoint_id', type: dynamodb.AttributeType.STRING },
        });

        // Writes Table
        new dynamodb.Table(this, 'WritesTable', {
            tableName: writesTableName,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'thread_id_checkpoint_id_checkpoint_ns',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: { name: 'task_id_idx', type: dynamodb.AttributeType.STRING },
        });
    }
}
```

## Using the Checkpoint Saver

### Default

To use the DynamoDB checkpoint saver, you only need to specify the names of
the checkpoints and writes tables. In this scenario the DynamoDB client will
be instantiated with the default configuration, great for running on AWS Lambda.

```typescript
...
const checkpointsTableName = 'YourCheckpointsTableName';
const writesTableName = 'YourWritesTableName';

const memory = new DynamoDBSaver({
    checkpointsTableName,
    writesTableName,
});

const graph = workflow.compile({ checkpointer: memory });
```

### Providing Client Configuration

If you need to provide custom configuration to the DynamoDB client, you can
pass in an object with the configuration options. Below is an example of how
you can provide custom configuration.

```typescript
const memory = new DynamoDBSaver({
    checkpointsTableName,
    writesTableName,
    clientConfig: {
        region: 'us-west-2',
        accessKeyId: 'your-access-key-id',
        secretAccessKey: 'your-secret-access-key',
    },
});
```

### Custom Serde (Serialization/Deserialization)

Just as with the Sqlite and MongoDB checkpoint savers, you can provide custom
serialization and deserialization functions. Below is an example of how you can
provide custom serialization and deserialization functions.

```typescript
import { serialize, deserialize } from '@ungap/structured-clone';
const serde = {
    dumpsTyped: async function (obj: unknown): [string, Uint8Array] {
        if (obj instanceof Uint8Array) {
            return ['bytes', obj];
        } else {
            return ['json', new TextEncoder().encode(serialize(obj))];
        }
    },
    loadsTyped: async function (type: string, data: Uint8Array | string): unknown {
        switch (type) {
            case 'json':
                return deserialize(
                    typeof data === 'string' ? data : new TextDecoder().decode(data)
                );
            case 'bytes':
                return typeof data === 'string' ? new TextEncoder().encode(data) : data;
            default:
                throw new Error(`Unknown serialization type: ${type}`);
        }
    },
};

const memory = new DynamoDBSaver({
    checkpointsTableName,
    writesTableName,
    serde,
});
```
