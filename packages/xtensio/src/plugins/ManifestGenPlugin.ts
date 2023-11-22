import { Compiler, sources } from "webpack"
import sandboxExec from "../sandbox/helper"

const PLUGIN_NAME = "Xtensio-Manifest-Generator"

interface ManifestGenPluginOptions {
  filename: string
  outFilename: string
  extend: Record<string, any>
}

class ManifestGenPlugin {
  options: ManifestGenPluginOptions
  constructor(options: ManifestGenPluginOptions) {
    this.options = options
    this.options.outFilename =
      this.options.outFilename ?? this.options.filename.replace(/\..+/, ".json")
  }

  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        PLUGIN_NAME,
        async (assets) => {
          const asset = assets[this.options.filename]
          if (asset) {
            const source = asset.source()
            const commonJsSource = `const self={};\n${source}\nmodule.exports = xtensioExports`
            const { default: manifestExport } = await sandboxExec.source(
              commonJsSource,
              {
                default: "default"
              }
            )
            if (!manifestExport)
              console.error(`[${PLUGIN_NAME}]: Default export not found!`)

            const isMV2 = manifestExport.manifest_version === 2

            const manifestVersion2Overrides = isMV2
              ? {
                  background: {
                    scripts: ["background.js"],
                    persistent: false,
                    type: "module"
                  },
                  action: undefined,
                  browser_action: {
                    default_popup: "popup.html",
                    options_ui: {
                      page: "settings.html",
                      open_in_tab: true
                    }
                  },
                  browser_specific_settings:
                    this.options.extend.browser_specific_settings
                }
              : {}

            const manifestObj = {
              ...(manifestExport || {}),
              ...this.options.extend,
              permissions: [
                ...(manifestExport.permissions || []),
                ...(this.options.extend.permissions || [])
              ],
              ...manifestVersion2Overrides
            }
            const outSource = JSON.stringify(manifestObj, null, 2)
            compilation.deleteAsset(this.options.filename)
            compilation.emitAsset(
              this.options.outFilename,
              new sources.RawSource(outSource)
            )
          }
        }
      )
    })
  }
}

export default ManifestGenPlugin
