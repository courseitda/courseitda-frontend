// Seed database functionality disabled
// Users need to register their own accounts

export const seedDatabase = async () => {
  // Seeding disabled - users must register
  console.log('Database seeding disabled. Please register a new account.');
};

// Auto-seed disabled
if (typeof window !== 'undefined') {
  seedDatabase().catch(console.error);
}
