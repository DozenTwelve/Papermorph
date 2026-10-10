# MathJax (vendored)

`tex-svg-full.js` is the unmodified `es5/tex-svg-full.js` from npm `mathjax@3.2.2`, licensed under Apache-2.0 (`LICENSE`, from the same package). It holds TeX input with every extension and SVG output with the TeX fonts in one file, so a book renders formulas offline.

| File | Bytes | sha256 |
| --- | --- | --- |
| `tex-svg-full.js` | 2275113 | `a4354ff94fd868aea0cc6eaaa79a57fda0588646fc46ee3700a349ee0a11cbe6` |
| `LICENSE` | 11358 | `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` |

Source: `https://registry.npmjs.org/mathjax/-/mathjax-3.2.2.tgz`, also `https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg-full.js`. The repository's `.gitattributes` keeps this folder byte-exact (`-text`), so the checksums hold on every OS.

A book that uses LaTeX copies `tex-svg-full.js` to `lib/mathjax.js` and `LICENSE` to `lib/mathjax-LICENSE.txt` ([site.md](../../../references/site.md#start-a-book-folder)); its chapters load `../lib/mathjax.js` right after `engine.js`, which sets the MathJax configuration.

To update, replace both files from a newer 3.x release, update the version and checksums here, and run `scripts/check_latex.py`. MathJax 4 splits extensions and fonts into separate files and needs a different setup.
