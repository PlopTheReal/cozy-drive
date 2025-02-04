import { DOCTYPE_FILES } from 'drive/lib/doctypes'

/**
 * Query files by created_at
 *
 * @param {object} client - The CozyClient instance
 * @param {string} endDate - The max file date to query
 * @param {string} bookmark - The query bookmark
 * @returns {Array} The files sorted by (createdByApp, created_at)
 */
export const queryFilesByDate = async (client, endDate, bookmark = '') => {
  const selector = {
    'cozyMetadata.createdByApp': {
      $gt: null
    },
    'cozyMetadata.uploadedAt': { $lte: endDate }
  }
  const options = {
    partialFilter: {
      type: 'file',
      trashed: false
    },
    fields: ['cozyMetadata.createdByApp', 'size'],
    indexedFields: ['cozyMetadata.createdByApp', 'cozyMetadata.uploadedAt'],
    sort: [
      { 'cozyMetadata.createdByApp': 'asc' },
      { 'cozyMetadata.uploadedAt': 'asc' }
    ],
    limit: 1000,
    bookmark
  }
  // We directly use the collection to avoid using the store for nothing.
  return client.collection(DOCTYPE_FILES).find(selector, options)
}
