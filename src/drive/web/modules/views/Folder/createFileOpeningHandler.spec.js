import { createMockClient } from 'cozy-client'
import { shouldBeOpenedByOnlyOffice } from 'cozy-client/dist/models/file'

import { generateFile } from 'test/generate'
import { openLocalFile } from 'drive/mobile/modules/offline/duck'
import createFileOpeningHandler from './createFileOpeningHandler'

jest.mock('drive/mobile/modules/offline/duck', () => ({
  openLocalFile: jest.fn()
}))

jest.mock('cozy-client/dist/models/file', () => ({
  ...jest.requireActual('cozy-client/dist/models/file'),
  shouldBeOpenedByOnlyOffice: jest.fn()
}))

describe('createFileOpeningHandler', () => {
  let client
  let dispatch
  let navigateToFile
  let replaceCurrentUrl
  let openInNewTab
  let routeTo
  const isFlatDomain = true
  let genericFile
  let setup
  let shortcutFile
  let onlyofficeFile
  let noteFile

  beforeEach(() => {
    client = createMockClient({})
    dispatch = jest.fn()
    navigateToFile = jest.fn()
    replaceCurrentUrl = jest.fn()
    openInNewTab = jest.fn()
    routeTo = jest.fn()
    client.getStackClient = jest.fn(() => client)
    client.collection = jest.fn(() => client)
    client.fetchURL = jest.fn()
    client.uri = 'http://cozy.tools'
    genericFile = generateFile({ i: 0 })
    noteFile = generateFile({
      prefix: 'my-note-',
      i: 1,
      type: 'file',
      ext: '.cozy-note'
    })

    noteFile.metadata = {
      content: '',
      schema: '',
      title: '',
      version: ''
    }

    shortcutFile = generateFile({
      prefix: 'cozy',
      i: 2,
      type: 'file',
      ext: '.url'
    })
    shortcutFile.class = 'shortcut'

    onlyofficeFile = generateFile({ i: 3 })
    onlyofficeFile.class = 'slide'

    setup = ({ isOnlyOfficeEnabled } = { isOnlyOfficeEnabled: true }) =>
      createFileOpeningHandler({
        client,
        isFlatDomain,
        dispatch,
        navigateToFile,
        replaceCurrentUrl,
        openInNewTab,
        routeTo,
        isOnlyOfficeEnabled
      })
  })

  it('should open an offline file', async () => {
    const handler = setup()
    await handler({ file: genericFile, isAvailableOffline: true })
    expect(openLocalFile).toHaveBeenCalledWith(client, genericFile)
  })

  it('should navigate to a normal file', async () => {
    const handler = setup()
    await handler({ file: genericFile, isAvailableOffline: false })
    expect(navigateToFile).toHaveBeenCalledWith(genericFile)
  })

  it('should redirect to the notes app', async () => {
    client.fetchURL.mockResolvedValue({
      data: {
        note_id: 'note-id',
        subdomain: 'notes',
        protocol: 'https',
        instance: 'cozy-tools.cloud',
        sharecode: 'sharecode',
        public_name: 'public note'
      }
    })
    const handler = setup()
    await handler({ file: noteFile, isAvailableOffline: false })
    expect(replaceCurrentUrl).toHaveBeenCalledWith(
      'https://cozy-tools-notes.cloud/public/?id=note-id&sharecode=sharecode&username=public+note#/'
    )
  })

  it('should open a shortcut in a new tab', async () => {
    const handler = setup()
    await handler({ file: shortcutFile, isAvailableOffline: false })
    expect(openInNewTab).toHaveBeenCalledWith(
      `http://cozy-drive.tools/#/external/${shortcutFile.id}`
    )
  })

  it('should redirect to the file for an onlyoffice document with onlyoffice activated', async () => {
    shouldBeOpenedByOnlyOffice.mockReturnValue(true)
    const handler = setup()
    await handler({
      event: {},
      file: onlyofficeFile,
      isAvailableOffline: false
    })

    expect(openInNewTab).not.toHaveBeenCalled()
    expect(replaceCurrentUrl).not.toHaveBeenCalled()
    expect(routeTo).toHaveBeenCalledWith(`/onlyoffice/${onlyofficeFile.id}`)
    expect(navigateToFile).not.toHaveBeenCalled()
  })

  it('should redirect to the file for an onlyoffice document with onlyoffice deactivated', async () => {
    shouldBeOpenedByOnlyOffice.mockReturnValue(true)
    const handler = setup({ isOnlyOfficeEnabled: false })
    await handler({ file: onlyofficeFile, isAvailableOffline: false })
    expect(navigateToFile).toHaveBeenCalledWith(onlyofficeFile)
  })

  it('should open the onlyoffice file in a new tab with onlyoffice activated and key pressed when clicking the link', async () => {
    shouldBeOpenedByOnlyOffice.mockReturnValue(true)
    const events = [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }]
    const handler = setup()

    for (const event of events) {
      await handler({
        event,
        file: onlyofficeFile,
        isAvailableOffline: false
      })

      expect(openInNewTab).toHaveBeenCalled()
      expect(replaceCurrentUrl).not.toHaveBeenCalled()
      expect(routeTo).not.toHaveBeenCalled()
      expect(navigateToFile).not.toHaveBeenCalled()
    }
  })

  it('should navigate to the file for an onlyoffice document with onlyoffice not activated', async () => {
    shouldBeOpenedByOnlyOffice.mockReturnValue(false)
    const handler = setup()
    await handler({
      event: {},
      file: onlyofficeFile,
      isAvailableOffline: false
    })

    expect(openInNewTab).not.toHaveBeenCalled()
    expect(replaceCurrentUrl).not.toHaveBeenCalled()
    expect(navigateToFile).toHaveBeenCalled()
  })
})
