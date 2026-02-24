
// Set test environment variables before any imports
process.env.MONGODB_URI = 'mongodb://test';
process.env.MONGODB_DB = 'test-db';

const mockDbInstance = { collection: jest.fn() };
const mockConnect = jest.fn();
const mockClose = jest.fn();

jest.mock('mongodb', () => ({
    MongoClient: jest.fn().mockImplementation(() => ({
        connect: mockConnect,
        db: () => mockDbInstance,
        close: mockClose,
    })),
}));

describe('lib/mongodb', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should connect and return db instance', async () => {
        const { getDb } = await import('@/lib/mongodb');
        const db = await getDb();
        expect(mockConnect).toHaveBeenCalled();
        expect(db).toBe(mockDbInstance);
    });


    it('should cache db instance', async () => {
        const { getDb } = await import('@/lib/mongodb');
        const db1 = await getDb();
        const db2 = await getDb();
        expect(db1).toBe(db2);
        expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should close and clear cache', async () => {
        const { getDb, closeDb } = await import('@/lib/mongodb');
        await getDb();
        await closeDb();
        expect(mockClose).toHaveBeenCalled();
        // After close, getDb should reconnect
        await getDb();
        expect(mockConnect).toHaveBeenCalledTimes(2);
    });
});