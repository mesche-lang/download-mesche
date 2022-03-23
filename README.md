# Download Mesche Action

This action downloads builds of the [Mesche
CLI](https://github.com/mesche-lang/cli) from CI runs of its repository so that
they can be used in your GitHub Actions workflows.

Once the Mesche build has been downloaded, it will be added to `PATH` so that
`mesche` can be invoked without a relative path.

## Inputs

This action accepts the following inputs:

### `artifact-token`

**Required** The GitHub token to use for GitHub API and artifact download requests.  At a minimum the token will will need `public:repo` permissions.  Unfortunately `${{ secrets.GITHUB_TOKEN }}` does not contain this permission so it cannot be used for artifact downloads.

### `os`

The target OS of the desired build. Possible values: `linux`, `macos`, and `win-mingw`. Defaults to the operating system on which this action is being executed.

### `arch`

The architecture of the desired build. Possible values: `x86_64`, `i686`. Defaults to `x86_64`.

### `repo`

The repository from which builds will be downloaded. Defaults to `mesche-lang/cli`.

### `workflow-name`

The name of the GitHub Actions workflow that produces build artifacts. Defaults to `Mesche CLI - CI`.

### `branch`

The branch from which builds will be downloaded. Defaults to `master`.

### `local-path`

The local path to which the Gambit build will be unpacked.  Defaults to `./bin`.

## Example

```yaml
jobs:
  Linux:
    runs-on: ubuntu-latest
    steps:
    - uses: daviwil/download-mesche@v1
      with:
        # Make sure to create the secret ARTIFACT_TOKEN with a personal
        # access token containing `public:repo` permissions.
        artifact-token: ${{ secrets.ARTIFACT_TOKEN }}

    - name: Run Mesche
      run: mesche
```
