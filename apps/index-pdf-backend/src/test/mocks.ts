// ============================================================================
// Mock Context for Router Tests
// ============================================================================

type MockContextOverrides = {
	requestId?: string;
	authToken?: string;
	user?: {
		id: string;
		email: string;
		name: string | null;
	};
};

export const createMockContext = (overrides: MockContextOverrides = {}) => ({
	requestId: "test-request-id",
	authToken: "mock-auth-token",
	...overrides,
});

// ============================================================================
// Mock User Objects
// ============================================================================

export const createMockUser = ({
	id = "00000000-0000-0000-0000-000000000001",
	email = "test@example.com",
	name = "Test User",
}: {
	id?: string;
	email?: string;
	name?: string;
} = {}) => ({
	id,
	email,
	name,
});

// ============================================================================
// Test Constants
// ============================================================================

export const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

// ============================================================================
// Mock PDF Buffer
// ============================================================================

export const createTestPdfBuffer = ({
	content = "test content",
}: {
	content?: string;
} = {}) => {
	return Buffer.from(`%PDF-1.4\n${content}`);
};
