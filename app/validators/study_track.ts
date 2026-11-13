import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'

/**
 * Extracts the 11-character YouTube video ID from common YouTube URL formats
 * (watch?v=, youtu.be/, embed/, shorts/, live/).
 */
export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id
      }
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = parsed.searchParams.get('v')
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam
      }

      const segments = parsed.pathname.split('/').filter(Boolean)
      if (
        segments.length >= 2 &&
        ['embed', 'shorts', 'live', 'v'].includes(segments[0]) &&
        /^[a-zA-Z0-9_-]{11}$/.test(segments[1])
      ) {
        return segments[1]
      }
    }
  } catch {
    // Fallback regex if URL constructor fails
  }

  const regexMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return regexMatch ? regexMatch[1] : null
}

/**
 * Custom VineJS rule to ensure a string is a valid YouTube video URL.
 */
const youtubeUrlRule = vine.createRule((value: unknown, _options, field: FieldContext) => {
  if (typeof value !== 'string') {
    return
  }

  const videoId = extractYoutubeVideoId(value)
  if (!videoId) {
    field.report(
      'Informe um link válido de vídeo do YouTube (ex: https://www.youtube.com/watch?v=...)',
      'youtubeUrl',
      field
    )
  }
})

/**
 * Validator for creating or updating a StudyTrack.
 */
export const studyTrackValidator = vine.create({
  title: vine.string().trim().minLength(3).maxLength(150),
  description: vine.string().trim().maxLength(1000).nullable().optional(),
  isPublic: vine.boolean().optional(),
  accessPassword: vine.string().trim().minLength(3).maxLength(100).nullable().optional(),
  removePassword: vine.boolean().optional(),
})

/**
 * Validator for creating or updating a Lesson in a StudyTrack.
 */
export const lessonValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(150),
  youtubeUrl: vine.string().trim().maxLength(500).use(youtubeUrlRule()),
})
