import flag from 'cozy-flags'

export const initFlags = () => {
  let activateFlags = flag('switcher') === true ? true : false

  if (process.env.NODE_ENV !== 'production' && flag('switcher') === null) {
    activateFlags = true
  }

  const searchParams = new URL(window.location).searchParams
  if (!activateFlags && searchParams.get('flags') !== null) {
    activateFlags = true
  }

  if (activateFlags) {
    flagsList()
  }
}

// flagName should use kebab case
const flagsList = () => {
  flag('switcher', true)
  flag('viewer-bottom-sheet-tension')
  flag('viewer-bottom-sheet-friction')
  flag('viewer-bottom-sheet-clamp')
  flag('drive.onlyoffice.forceReadOnlyOnDesktop') // flagName should use kebab case
  flag('drive.onlyoffice.editorToolbarHeight') // flagName should use kebab case
  flag('drive.logger')
  flag('drive.enable-encryption')
}
