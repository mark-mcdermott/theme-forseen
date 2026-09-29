# Releasing

How a new version gets to npm. Every step is a command to run from the root of this repository.

The version number and the changelog entry are part of the pull request that makes the changes, so by the time you are here they are already on `main`.

## 1. Get the released code

```bash
git switch main
git pull
pnpm install
```

Check the version that is about to go out. It must be higher than the one npm has.

```bash
node -p "require('./package.json').version"
npm view theme-forseen version
```

## 2. Make sure it works

```bash
pnpm build
pnpm test
```

If the tests complain that a browser is missing, run `pnpm exec playwright install chromium` and try again.

## 3. Look at what will be published

This publishes nothing. It lists the files that would go into the package.

```bash
npm publish --dry-run
```

Expect `dist/index.js`, `dist/data.js`, the `.d.ts` files, `dist/cli/index.js` and the `src` folder. There should be no `node_modules`, no `tests` and no `.env`.

## 4. Sign in to npm

```bash
npm whoami
```

If that prints `mark-mcdermott`, you are signed in. If it prints an error, sign in. This opens npm in the browser.

```bash
npm login
```

## 5. Publish

```bash
npm publish
```

npm asks you to confirm, in the browser or with a one-time code from your authenticator app. Building happens by itself first, through the `prepare` script.

A published version is permanent. It can be deprecated but its number can never be used again, so a mistake is fixed by publishing the next patch version.

## 6. Check it arrived

```bash
npm view theme-forseen version
```

## 7. Tag the release

```bash
git tag v0.6.0
git push origin v0.6.0
```

Use the version you just published.

## Trying a release before it is final

To let a site install a version without making it the one everybody gets, give it a prerelease number in `package.json`, such as `0.7.0-beta.0`, and publish it under another tag:

```bash
npm publish --tag next
```

`npm install theme-forseen` still installs the latest final release. `npm install theme-forseen@next` installs the prerelease.
