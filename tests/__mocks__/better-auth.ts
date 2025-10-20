export const betterAuth = jest.fn(() => ({
  // mock only what your code actually uses
  getSession: jest.fn(() => ({
    user: { id: "mock-user", email: "mock@example.com" },
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

export const prismaAdapter = jest.fn();

export const auth = {
  api: {
    getSession: jest.fn().mockResolvedValue(null), // or a mock session object if needed
  },
};
