import React, { useEffect, useRef } from 'react'
import Hammer from '@egjs/hammerjs'
import propagating from 'propagating-hammerjs'

import { models } from 'cozy-client'

import { makeOnlyOfficeFileRoute } from 'drive/web/modules/views/OnlyOffice/helpers'

import styles from './fileopener.styl'

const getParentDiv = element => {
  if (element.nodeName.toLowerCase() === 'div') {
    return element
  }
  return getParentDiv(element.parentNode)
}

export const getParentLink = element => {
  if (!element) {
    return null
  }

  if (element.nodeName.toLowerCase() === 'a') {
    return element
  }

  return getParentLink(element.parentNode)
}

const enableTouchEvents = ev => {
  // remove event when you rename a file
  if (['INPUT', 'BUTTON'].indexOf(ev.target.nodeName) !== -1) {
    return false
  }

  const parentDiv = getParentDiv(ev.target)
  // remove event when it's the checkbox or the more button
  if (
    parentDiv.className.indexOf(styles['fil-content-file-select']) !== -1 ||
    parentDiv.className.indexOf(styles['fil-content-file-action']) !== -1
  ) {
    return false
  }

  // Check if the clicked element is a file path, in that case the FileOpener has nothing to handle
  if (ev.srcEvent.target.closest('[class^="fil-file-path"]')) return false

  return true
}

const FileOpener = ({
  file,
  disabled,
  actionMenuVisible,
  toggle,
  open,
  selectionModeActive,
  isRenaming,
  children
}) => {
  const rowRef = useRef()

  useEffect(() => {
    if (!rowRef || !rowRef.current) return

    const gesturesHandler = propagating(new Hammer(rowRef.current))

    gesturesHandler.on('tap press singletap', ev => {
      if (actionMenuVisible || disabled) return
      if (enableTouchEvents(ev)) {
        ev.preventDefault() // prevent a ghost click
        if (ev.type === 'press' || selectionModeActive) {
          ev.srcEvent.stopImmediatePropagation()
          toggle(ev.srcEvent)
        } else {
          ev.srcEvent.stopImmediatePropagation()
          if (!isRenaming) open(ev.srcEvent, file)
        }
      }
    })

    return () => {
      gesturesHandler && gesturesHandler.destroy()
    }
  }, [
    rowRef,
    file,
    disabled,
    actionMenuVisible,
    toggle,
    open,
    selectionModeActive,
    isRenaming
  ])

  if (models.file.shouldBeOpenedByOnlyOffice(file)) {
    return (
      <a
        data-testid="onlyoffice-link"
        className={`${styles['file-opener']} ${styles['file-opener__a']}`}
        ref={rowRef}
        id={file.id}
        href={makeOnlyOfficeFileRoute(file)}
        onClick={ev => {
          ev.preventDefault()
        }}
      >
        {children}
      </a>
    )
  }

  const isFolder = file =>
    file.attributes && file.attributes.type === 'directory'
  const isFile = file => file.attributes && file.attributes.type === 'file'
  const isShortcut = file => file.class === 'shortcut'
  const isNote = file => file.name.endsWith('.cozy-note')
  let buildHref = ''
  if (isFolder(file)) {
    buildHref = `/#/folder/${file.id}`
  } else if (isNote(file)) {
    console.log('isNote')
    console.log({ file })
    // DO NOTHING
    // http://drive.cozy.localhost:8080/#/folder/io.cozy.files.root-dir/file/682e64b839470826fda67a4abc022ff4
    // notes.cozy.localhost:8080/#/n/682e64b839470826fda67a4abc022ff4
  } else if (isShortcut(file)) {
    console.log('isShortcut')
    console.log({ file })
    // generate external file <=
    // DO NOTHING
  } else if (isFile(file)) {
    buildHref = `/#/folder/${file.dir_id}/file/${file.id}`
  } else {
    console.log('NOT FILE')
    console.log({ file })
    buildHref = ''
  }

  return (
    <a // works only with folder broken
      data-testid="not-onlyoffice-span"
      className={`${styles['file-opener']} ${styles['file-opener__a']}`}
      ref={rowRef}
      id={file.id}
      href={buildHref}
      onClick={ev => {
        ev.preventDefault()
      }}
    >
      {children}
    </a>
  )
}

export default FileOpener
