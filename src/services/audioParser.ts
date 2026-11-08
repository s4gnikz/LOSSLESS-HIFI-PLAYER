import { AudioTrack } from '../types/audio';

export async function parseAudioFile(file: File): Promise<Partial<AudioTrack>> {
  const extension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  let format: AudioTrack['format'] = 'WAV';
  
  if (['FLAC', 'WAV', 'AIFF', 'ALAC', 'OGG', 'MP3', 'AAC'].includes(extension)) {
    format = extension as AudioTrack['format'];
  } else if (file.type.includes('flac')) {
    format = 'FLAC';
  } else if (file.type.includes('wav')) {
    format = 'WAV';
  } else if (file.type.includes('mpeg') || file.type.includes('mp3')) {
    format = 'MP3';
  }

  // Base fallback metadata from file name
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
  let title = nameWithoutExt;
  let artist = "Unknown Artist";
  let album = "Hi-Res Audio Collection";

  if (nameWithoutExt.includes(" - ")) {
    const parts = nameWithoutExt.split(" - ");
    artist = parts[0].trim();
    title = parts.slice(1).join(" - ").trim();
  }

  let bitDepth = 16;
  let sampleRate = 44100;
  let channels = 2;
  let coverArt: string | undefined = undefined;

  try {
    // Read the first 256KB to quickly parse headers
    const headerSlice = await file.slice(0, 262144).arrayBuffer();
    const view = new DataView(headerSlice);

    if (format === 'FLAC' || (view.getUint32(0, false) === 0x664C6143)) {
      format = 'FLAC';
      const parsedFlac = parseFlacHeader(headerSlice);
      if (parsedFlac) {
        sampleRate = parsedFlac.sampleRate || sampleRate;
        bitDepth = parsedFlac.bitDepth || bitDepth;
        channels = parsedFlac.channels || channels;
        if (parsedFlac.title) title = parsedFlac.title;
        if (parsedFlac.artist) artist = parsedFlac.artist;
        if (parsedFlac.album) album = parsedFlac.album;
        if (parsedFlac.coverArt) coverArt = parsedFlac.coverArt;
      }
    } else if (format === 'WAV' || (view.getUint32(0, false) === 0x52494646 && view.getUint32(8, false) === 0x57415645)) {
      format = 'WAV';
      const parsedWav = parseWavHeader(headerSlice);
      if (parsedWav) {
        sampleRate = parsedWav.sampleRate || sampleRate;
        bitDepth = parsedWav.bitDepth || bitDepth;
        channels = parsedWav.channels || channels;
      }
    } else if (format === 'MP3') {
      const parsedId3 = parseId3Tags(headerSlice);
      if (parsedId3) {
        if (parsedId3.title) title = parsedId3.title;
        if (parsedId3.artist) artist = parsedId3.artist;
        if (parsedId3.album) album = parsedId3.album;
        if (parsedId3.coverArt) coverArt = parsedId3.coverArt;
      }
    }
  } catch (err) {
    console.warn("Fast header parsing failed, will rely on Web Audio decoder:", err);
  }

  const isHiResLossless = (bitDepth >= 24 && sampleRate >= 48000) || (sampleRate >= 96000);
  const isDolbyAtmosMaster = channels > 2 || title.toLowerCase().includes('atmos') || title.toLowerCase().includes('spatial');

  return {
    title,
    artist,
    album,
    format,
    bitDepth,
    sampleRate,
    channels,
    coverArt,
    isHiResLossless,
    isDolbyAtmosMaster,
  };
}

function parseFlacHeader(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, false) !== 0x664C6143) return null; // 'fLaC'

  let offset = 4;
  let sampleRate = 44100;
  let bitDepth = 16;
  let channels = 2;
  let title: string | undefined;
  let artist: string | undefined;
  let album: string | undefined;
  let coverArt: string | undefined;

  while (offset + 4 <= buffer.byteLength) {
    const blockHeader = view.getUint8(offset);
    const isLast = (blockHeader & 0x80) !== 0;
    const blockType = blockHeader & 0x7F;
    const blockLength = (view.getUint8(offset + 1) << 16) | (view.getUint8(offset + 2) << 8) | view.getUint8(offset + 3);
    offset += 4;

    if (offset + blockLength > buffer.byteLength) break;

    if (blockType === 0) {
      // STREAMINFO
      // Sample rate is in bits 80-99 (20 bits)
      // Channels is in bits 100-102 (3 bits, value + 1)
      // Bits per sample is in bits 103-107 (5 bits, value + 1)
      const b10 = view.getUint8(offset + 10);
      const b11 = view.getUint8(offset + 11);
      const b12 = view.getUint8(offset + 12);
      const b13 = view.getUint8(offset + 13);

      sampleRate = (b10 << 12) | (b11 << 4) | (b12 >> 4);
      channels = ((b12 >> 1) & 0x07) + 1;
      bitDepth = (((b12 & 0x01) << 4) | (b13 >> 4)) + 1;
    } else if (blockType === 4) {
      // VORBIS_COMMENT
      try {
        const textDecoder = new TextDecoder('utf-8');
        let cOffset = offset;
        const vendorLen = view.getUint32(cOffset, true);
        cOffset += 4 + vendorLen;
        const commentListLen = view.getUint32(cOffset, true);
        cOffset += 4;

        for (let i = 0; i < commentListLen && cOffset < offset + blockLength; i++) {
          const commentLen = view.getUint32(cOffset, true);
          cOffset += 4;
          const commentStr = textDecoder.decode(new Uint8Array(buffer, cOffset, commentLen));
          cOffset += commentLen;

          const eqIdx = commentStr.indexOf('=');
          if (eqIdx > -1) {
            const key = commentStr.substring(0, eqIdx).toUpperCase();
            const val = commentStr.substring(eqIdx + 1);
            if (key === 'TITLE') title = val;
            if (key === 'ARTIST') artist = val;
            if (key === 'ALBUM') album = val;
          }
        }
      } catch (e) {
        // ignore comment parsing errors
      }
    } else if (blockType === 6) {
      // PICTURE
      try {
        let pOffset = offset;
        // Picture type (4 bytes)
        pOffset += 4;
        // MIME length
        const mimeLen = view.getUint32(pOffset, false);
        pOffset += 4;
        const mime = new TextDecoder('ascii').decode(new Uint8Array(buffer, pOffset, mimeLen));
        pOffset += mimeLen;
        // Description length
        const descLen = view.getUint32(pOffset, false);
        pOffset += 4 + descLen;
        // Width, height, color depth, colors used
        pOffset += 16;
        // Picture data length
        const dataLen = view.getUint32(pOffset, false);
        pOffset += 4;
        if (pOffset + dataLen <= buffer.byteLength) {
          const imgBytes = new Uint8Array(buffer, pOffset, dataLen);
          const blob = new Blob([imgBytes], { type: mime || 'image/jpeg' });
          coverArt = URL.createObjectURL(blob);
        }
      } catch (e) {
        // ignore picture errors
      }
    }

    if (isLast) break;
    offset += blockLength;
  }

  return { sampleRate, bitDepth, channels, title, artist, album, coverArt };
}

function parseWavHeader(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  let offset = 12; // skip RIFF and WAVE

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);
    offset += 8;

    if (chunkId === 'fmt ') {
      const channels = view.getUint16(offset + 2, true);
      const sampleRate = view.getUint32(offset + 4, true);
      const bitDepth = view.getUint16(offset + 14, true);
      return { channels, sampleRate, bitDepth };
    }

    offset += chunkSize;
    if (chunkSize % 2 !== 0) offset += 1; // 16-bit word alignment
  }
  return null;
}

function parseId3Tags(buffer: ArrayBuffer): { title?: string; artist?: string; album?: string; coverArt?: string } | null {
  const view = new DataView(buffer);
  if (buffer.byteLength < 10) return null;
  // Check for 'ID3' header
  if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) {
    return null;
  }
  return null;
}
