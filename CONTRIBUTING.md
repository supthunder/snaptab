# Contributing to SnapTab

Thank you for your interest in contributing to SnapTab! We welcome contributions from the community to help make group expense tracking even better.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database
- OpenAI API key

### Installation
```bash
# Clone your fork
git clone https://github.com/yourusername/snaptab.git
cd snaptab

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Set up database
pnpm prisma migrate dev

# Start development server
pnpm dev
```

## Code Style

- We use TypeScript for type safety
- Follow the existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the version numbers in package.json if applicable
3. Ensure all tests pass
4. Ensure your code follows the project's coding standards
5. Your PR will be reviewed by maintainers

## Feature Requests

If you have an idea for a new feature, please open an issue first to discuss it before implementing.

## Bug Reports

When reporting bugs, please include:
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser/device information

## Code of Conduct

Please note that this project is released with a Code of Conduct. By participating in this project you agree to abide by its terms.

## Questions?

Feel free to open an issue if you have questions about contributing!