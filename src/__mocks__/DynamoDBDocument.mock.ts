/* eslint-disable @typescript-eslint/no-explicit-any */
export class MockDynamoDBDocument {
    private tables: Record<string, Record<string, any>> = {};

    constructor() {
        // Initialize in-memory tables
        this.tables = {};
    }

    async get(params: { TableName: string; Key: Record<string, any> }) {
        const { TableName, Key } = params;
        const table = this.tables[TableName] || {};
        const itemKey = JSON.stringify(Key);
        const Item = table[itemKey];
        return { Item };
    }

    async put(params: { TableName: string; Item: any }) {
        const { TableName, Item } = params;

        this.sizeGuard(Item);

        const table = this.tables[TableName] || {};
        const keyAttributes = this.getKeyAttributes(Item);
        const itemKey = JSON.stringify(keyAttributes);
        table[itemKey] = Item;
        this.tables[TableName] = table;
        return {};
    }

    async query(params: {
        TableName: string;
        KeyConditionExpression: string;
        ExpressionAttributeValues: Record<string, any>;
        Limit?: number;
        ScanIndexForward?: boolean;
        FilterExpression?: string;
        ConsistentRead?: boolean;
    }) {
        const { TableName, ExpressionAttributeValues, Limit, ScanIndexForward } = params;
        const table = this.tables[TableName] || {};
        const items = Object.values(table);

        const filteredItems = this.filterItems(items, ExpressionAttributeValues);
        const sortedItems = this.sortItems(filteredItems, ScanIndexForward);
        const limitedItems = this.limitItems(sortedItems, Limit);

        return { Items: limitedItems };
    }

    async batchWrite(params: { RequestItems: Record<string, any[]> }) {
        for (const TableName in params.RequestItems) {
            this.processTableRequests(TableName, params.RequestItems[TableName]);
        }
        return {};
    }

    private filterItems(items: any[], ExpressionAttributeValues: Record<string, any>): any[] {
        return items.filter(item => {
            for (const key in ExpressionAttributeValues) {
                const attributeName = key.replace(':', '');
                if (item[attributeName] !== ExpressionAttributeValues[key]) {
                    return false;
                }
            }
            return true;
        });
    }

    private sortItems(items: any[], ScanIndexForward?: boolean): any[] {
        if (ScanIndexForward === undefined) return items;

        return items.sort((a, b) => {
            const aKey = a.checkpoint_id;
            const bKey = b.checkpoint_id;
            if (ScanIndexForward) {
                return aKey.localeCompare(bKey);
            } else {
                return bKey.localeCompare(aKey);
            }
        });
    }

    private limitItems(items: any[], Limit?: number): any[] {
        return Limit ? items.slice(0, Limit) : items;
    }

    private processTableRequests(TableName: string, requests: any[]) {
        const table = this.tables[TableName] || {};
        for (const request of requests) {
            if (request.PutRequest) {
                this.processPutRequest(table, request.PutRequest.Item);
            }
            // Handle other requests if needed
        }
        this.tables[TableName] = table;
    }

    private processPutRequest(table: Record<string, any>, Item: any) {
        this.sizeGuard(Item);
        const keyAttributes = this.getKeyAttributes(Item);
        const itemKey = JSON.stringify(keyAttributes);
        table[itemKey] = Item;
    }

    private calculateItemSize(item: any): number {
        // Serialize the item to a JSON string
        const serializedItem = JSON.stringify(item);

        // Calculate the byte length of the serialized item using UTF-8 encoding
        const itemSizeInBytes = new TextEncoder().encode(serializedItem).length;

        return itemSizeInBytes;
    }

    // Helper method to extract key attributes from an item
    private getKeyAttributes(item: any): Record<string, any> {
        const keyAttributes: Record<string, any> = {};
        if (item.thread_id) keyAttributes.thread_id = item.thread_id;
        if (item.checkpoint_id) keyAttributes.checkpoint_id = item.checkpoint_id;
        return keyAttributes;
    }

    private sizeGuard(item: any) {
        const itemSizeInBytes = this.calculateItemSize(item);
        if (itemSizeInBytes > 409600) {
            throw new Error('Item size has exceeded the maximum allowed size');
        }
    }
}
