import { DOCTYPE_ALBUMS } from 'drive/lib/doctypes'
import get from 'lodash/get'

/**
 * Returns the photos metadata sorted by date, from oldest to newest
 * @param {Object[]} photos - Set of photos
 * @returns {Object[]} The metadata's photos sorted by date
 */
export const prepareDataset = (photos, albums = []) => {
  const albumIds = albums.map(album => album._id)

  const info = photos
    .map(file => {
      const photo = {
        id: file._id || file.id,
        clusterId: file.clusterId,
        albums: file.albums
      }
      // Depending on the query, the attributes object might exists, or not
      const attributes = file.attributes ? file.attributes : file
      photo.name = attributes.name
      const metadata = attributes.metadata
      if (metadata) {
        photo.datetime = metadata.datetime
        photo.lat = metadata.gps ? metadata.gps.lat : null
        photo.lon = metadata.gps ? metadata.gps.long : null
      } else {
        photo.datetime = attributes.created_at
      }
      const hours = new Date(photo.datetime).getTime() / 1000 / 3600
      photo.timestamp = hours
      // For each photo, we need to check the clusterid, i.e. the auto-album
      // referenced by the file. If there is none, the photo wasn't clustered before
      if (!photo.clusterId && get(file, 'relationships.referenced_by.data')) {
        const ref = file.relationships.referenced_by.data.find(
          ref => ref.type === DOCTYPE_ALBUMS && albumIds.includes(ref.id)
        )
        if (ref) {
          photo.clusterId = ref.id
        }
      }
      return photo
    })
    .sort((pa, pb) => pa.timestamp - pb.timestamp)

  return info
}

/**
 * Compute the mean date based on the photos' timestamp
 * @param {Object[]} photos - Set of photos
 * @returns {Date} The average date
 */
export const averageTime = photos => {
  const sumHours = photos.reduce((acc, val) => acc + val.timestamp, 0)
  const averageHours = sumHours / photos.length
  return new Date(averageHours * 3600 * 1000).getTime()
}

/**
 *  Convert a duration into milliseconds.
 *  See https://golang.org/pkg/time/#ParseDuration for the duration format
 *  @param {string} duration - The duration in hms format
 *  @returns {number} The duration in milliseconds
 */
export const convertDurationInMilliseconds = duration => {
  const offsetH = duration.indexOf('h')
  const offsetM = duration.indexOf('m')
  const offsetS = duration.indexOf('s')

  const hours = offsetH > 0 ? duration.substring(0, offsetH) : 0
  const minutes = offsetM > 0 ? duration.substring(offsetH + 1, offsetM) : 0
  const seconds = offsetS > 0 ? duration.substring(offsetM + 1, offsetS) : 0
  return seconds * 1000 + minutes * 60 * 1000 + hours * 3600 * 1000
}

/**
 *  Hash a string into a 32-bit integer
 *  @param {string} toHash - The string to hash
 *  @returns {number} The 32-bit hash value
 */
const hashCode = toHash => {
  let hash = 0
  let i, chr
  if (toHash.length === 0) return toHash
  for (i = 0; i < toHash.length; i++) {
    chr = toHash.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash
}

/**
 *  Returns true if `instance` is chosen to be part of a progressive rollout, according to `percentage`
 *  @param {string} instance - The string to hash
 *  @param {number} percent - The percent of instances that should match
 *  @returns {boolean} If the instance is picked or not
 */
export const isPartOfProgressiveRollout = (instance, percent) => {
  return Math.abs(hashCode(instance)) % 100 <= percent
}
