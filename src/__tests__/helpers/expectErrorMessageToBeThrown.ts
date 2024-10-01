/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'bun:test';

export async function expectErrorMessageToBeThrown(
    callback: () => Promise<unknown>,
    message: string
) {
    try {
        await callback();
        throw new Error("Expected function to throw an error, but it didn't");
    } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as any).message).toBe(message);
    }
}
