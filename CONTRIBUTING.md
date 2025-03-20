# Contributing to EternalFile

Thank you for your interest in contributing to EternalFile! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it to understand what behavior will not be tolerated.

## Getting Started

1. **Fork the Repository**
   - Click the "Fork" button at the top right of the repository page.

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/eternalfile.git
   cd eternalfile
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/eternalfile.git
   ```

4. **Install Dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

## Development Workflow

1. **Create a New Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
   Branch naming conventions:
   - `feature/` for new features
   - `bugfix/` for bug fixes
   - `docs/` for documentation changes
   - `test/` for test-related changes

2. **Make Your Changes**
   - Write clean, maintainable code
   - Follow the existing code style
   - Add or update tests as needed

3. **Run Tests Locally**
   ```bash
   # Run client tests
   cd client
   npm test
   
   # Run server tests
   cd ../server
   npm test
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
   
   We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test-related changes
   - `refactor:` for code refactoring
   - `style:` for code style changes
   - `chore:` for changes to the build process or auxiliary tools

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your branch and submit the PR with a clear description

## Pull Request Guidelines

- Keep PRs focused on a single feature or bug fix
- Include screenshots for UI changes
- Update documentation as needed
- Ensure all tests pass
- Add tests for new features
- Respond to feedback and be open to making changes

## Code Style and Standards

- Follow the existing code style in the repository
- Use ESLint and Prettier to maintain code quality
- Write self-documenting code with clear variable and function names
- Add comments for complex logic

## Reporting Bugs

- Use the bug report issue template
- Provide detailed steps to reproduce
- Include information about your environment
- Attach screenshots if applicable

## Suggesting Features

- Use the feature request issue template
- Clearly describe the problem your feature would solve
- Explain how your suggestion would benefit users
- Include mockups or examples if possible

## Setting Up the Development Environment

1. **Environment Variables**
   - Copy the example env files:
     ```bash
     cp client/.env.example client/.env.development
     cp server/.env.example server/.env.development
     ```
   - Modify them with your local settings

2. **Running the Development Servers**
   ```bash
   # Start client development server
   cd client
   npm run dev
   
   # Start server development server (in a new terminal)
   cd server
   npm run dev
   ```

## Getting Help

If you need help with anything related to the project, you can:
- Open a discussion on GitHub
- Ask questions in the comments of relevant issues
- Reach out to the maintainers

## Thank You

Your contributions help make EternalFile better for everyone. We appreciate your time and effort! 