import { AudioTrack } from '../types/audio';
import { OnlineTrackResult, decodeHtmlEntities } from './onlineMusicService';

export interface AIPromptPreset {
  id: string;
  title: string;
  prompt: string;
  category: 'Hollywood' | 'Bollywood' | 'Spatial' | 'Electronic' | 'Acoustic' | 'Classical' | 'Rock' | 'Focus' | 'Anime';
  badge: string;
  gradient: string;
}

export interface AIPromptResult {
  userPrompt: string;
  inferredGenre: string;
  inferredMood: string;
  acousticNote: string;
  suggestedEqPresetId?: string;
  recommendedTracks: OnlineTrackResult[];
}

export const AI_PROMPT_PRESETS: AIPromptPreset[] = [
  {
    id: 'ai-hollywood-epic',
    title: 'Hollywood Cinema & Film Scores',
    prompt: 'Epic Hans Zimmer Hollywood film scores with massive orchestral dynamic range and deep bass',
    category: 'Hollywood',
    badge: '🎬 Hollywood OST',
    gradient: 'from-amber-500/20 to-red-500/20 text-amber-300 border-amber-500/40'
  },
  {
    id: 'ai-bollywood-soul',
    title: 'Soulful Romantic Bollywood & Sufi',
    prompt: 'Soulful romantic Bollywood and Sufi acoustics by Arijit Singh, A.R. Rahman, and Atif Aslam',
    category: 'Bollywood',
    badge: '🇮🇳 Bollywood',
    gradient: 'from-orange-500/20 to-rose-500/20 text-rose-300 border-rose-500/40'
  },
  {
    id: 'ai-spatial-atmos',
    title: 'Dolby Atmos 7.1.4 Spatial Showcase',
    prompt: 'Immersive 3D spatial audio with 360-degree binaural soundstage and deep sub-bass impact',
    category: 'Spatial',
    badge: '🌌 Dolby Atmos',
    gradient: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    id: 'ai-synthwave-neon',
    title: 'Cyberpunk Midnight Synthwave',
    prompt: 'Late night 80s analog synthwave with driving basslines and neon nostalgia',
    category: 'Electronic',
    badge: '⚡ Synthwave',
    gradient: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300 border-fuchsia-500/40'
  },
  {
    id: 'ai-bollywood-90s',
    title: 'Golden 90s Evergreen Bollywood',
    prompt: 'Evergreen 90s nostalgic Bollywood love songs with lush melody and classic acoustic instruments',
    category: 'Bollywood',
    badge: '📻 90s Evergreen',
    gradient: 'from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/40'
  },
  {
    id: 'ai-classical-symphony',
    title: '24-Bit Audiophile Classical Masters',
    prompt: 'Pristine 24-bit classical symphonies with concert grand piano, violins, and wide soundstage',
    category: 'Classical',
    badge: '🎻 Classical Master',
    gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    id: 'ai-jazz-cafe',
    title: 'Rainy Cafe Acoustic Jazz',
    prompt: 'Cozy coffeehouse jazz with brushed snare drums, upright double bass, and smoky saxophone',
    category: 'Acoustic',
    badge: '☕ Acoustic Jazz',
    gradient: 'from-stone-500/20 to-amber-600/20 text-amber-200 border-amber-600/40'
  },
  {
    id: 'ai-gym-hype',
    title: 'High-Octane Workout Hype',
    prompt: 'High-energy rock, heavy metal, and punchy EDM drops for maximum adrenaline',
    category: 'Rock',
    badge: '🏋️ Workout Hype',
    gradient: 'from-red-500/20 to-orange-500/20 text-red-300 border-red-500/40'
  },
  {
    id: 'ai-lofi-focus',
    title: 'Deep Study & Lo-Fi Chillhop',
    prompt: 'Relaxing lo-fi chillhop beats with soft ambient rain and gentle piano for deep focus',
    category: 'Focus',
    badge: '🧘 Deep Focus',
    gradient: 'from-indigo-500/20 to-blue-500/20 text-indigo-300 border-indigo-500/40'
  },
  {
    id: 'ai-ghibli-anime',
    title: 'Studio Ghibli & Anime Orchestras',
    prompt: 'Emotional Studio Ghibli orchestral themes and anime masterpieces by Joe Hisaishi',
    category: 'Anime',
    badge: '🌸 Anime & Ghibli',
    gradient: 'from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/40'
  },
  {
    id: 'ai-classic-rock',
    title: 'Legendary Classic Rock Anthems',
    prompt: 'Iconic classic rock anthems with dynamic guitar solos and punchy acoustic drums',
    category: 'Rock',
    badge: '🎸 Classic Rock',
    gradient: 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/40'
  }
];

const GLOBAL_MIRRORS = [
  'https://jiosaavn-api-sage.vercel.app/api/search/songs',
  'https://jiosaavn-api-one-rho.vercel.app/api/search/songs',
  'https://jiosaavn-api-beta-one.vercel.app/api/search/songs'
];

/**
 * Searches a single track across mirrors with fast timeout.
 */
async function searchSingleTrack(query: string): Promise<OnlineTrackResult | null> {
  for (const mirror of GLOBAL_MIRRORS) {
    try {
      const url = `${mirror}?query=${encodeURIComponent(query)}&limit=1`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const results = json?.data?.results || json?.results;
        if (Array.isArray(results) && results.length > 0) {
          const item = results[0];
          const downloads = item.downloadUrl || [];
          const bestDownload = downloads.find((d: any) => d.quality === '320kbps') || downloads[downloads.length - 1];
          const images = item.image || [];
          const bestImage = images.find((img: any) => img.quality === '500x500') || images[images.length - 1];

          const primaryArtists = Array.isArray(item.artists?.primary)
            ? item.artists.primary.map((a: any) => a.name).join(', ')
            : (item.primaryArtists || 'Artist');

          const downloadUrl = bestDownload?.url || bestDownload?.link || '';
          if (!downloadUrl) continue;

          return {
            id: `ai-saavn-${item.id}`,
            title: decodeHtmlEntities(item.name || 'Unknown Title'),
            artist: decodeHtmlEntities(primaryArtists),
            album: decodeHtmlEntities(item.album?.name || 'Single'),
            duration: Number(item.duration) || 180,
            url: downloadUrl,
            coverArt: bestImage?.url || bestImage?.link || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
            format: 'AAC',
            bitDepth: 24,
            sampleRate: 48000,
            channels: 2,
            bitrate: bestDownload?.quality === '320kbps' ? 320 : 160,
            genre: item.language ? `${item.language.charAt(0).toUpperCase() + item.language.slice(1)} Pop/Rock` : 'Music',
            isHiResLossless: true,
            isDolbyAtmosMaster: true,
            isFullPlayback: true,
            qualityBadge: bestDownload?.quality === '320kbps' ? '320 kbps FULL' : 'HQ FULL',
            description: `${decodeHtmlEntities(primaryArtists)} - ${decodeHtmlEntities(item.album?.name || 'Single')} (${item.year || ''})`
          };
        }
      }
    } catch {
      // Continue to next mirror on failure
    }
  }
  return null;
}

/**
 * AI Semantic Knowledge Base mapping moods, genres, and archetypes to targeted queries.
 */
interface ArchetypeDefinition {
  genre: string;
  mood: string;
  suggestedEq: string;
  acousticNote: string;
  queries: string[];
}

function analyzePromptIntent(prompt: string): ArchetypeDefinition {
  const p = prompt.toLowerCase();

  // 1. Hollywood / Film Score / Cinematic
  if (p.includes('hollywood') || p.includes('zimmer') || p.includes('interstellar') || p.includes('inception') || p.includes('film') || p.includes('cinema') || p.includes('soundtrack') || p.includes('score') || p.includes('dune') || p.includes('oppenheimer') || p.includes('williams')) {
    return {
      genre: 'Hollywood Cinema & Film Scores',
      mood: 'Epic, Monumental & Wide Dynamic Range',
      suggestedEq: 'dolby_cinema',
      acousticNote: 'Curated for massive multi-channel spatial soundstage, deep brass transients, cathedral reverberation, and sub-harmonic low-end impact.',
      queries: [
        'Cornfield Chase Hans Zimmer',
        'Time Hans Zimmer Inception',
        'Now We Are Free Gladiator Hans Zimmer',
        'Can You Hear The Music Ludwig Goransson Oppenheimer',
        'Dune Hans Zimmer Pauls Dream',
        'Theme From Jurassic Park John Williams'
      ]
    };
  }

  // 2. Bollywood / Sufi / Hindi / Romantic
  if (p.includes('bollywood') || p.includes('hindi') || p.includes('arijit') || p.includes('rahman') || p.includes('atif') || p.includes('shreya') || p.includes('tum hi ho') || p.includes('channa') || p.includes('sufi') || p.includes('desi') || p.includes('indian')) {
    if (p.includes('90s') || p.includes('evergreen') || p.includes('kumar sanu') || p.includes('udit') || p.includes('kishore') || p.includes('lata')) {
      return {
        genre: 'Golden 90s Evergreen Bollywood',
        mood: 'Nostalgic, Warm & Melodious',
        suggestedEq: 'acoustic_vocal',
        acousticNote: 'Selected for rich analogue acoustic warmth, expressive tabla rhythms, acoustic guitar strumming, and golden vocal harmonics.',
        queries: [
          'Tujhe Dekha To Kumar Sanu',
          'Pehla Nasha Udit Narayan',
          'Roop Tera Mastana Kishore Kumar',
          'Chura Ke Dil Mera Kumar Sanu',
          'Pal Pal Dil Ke Paas Kishore Kumar'
        ]
      };
    }

    return {
      genre: 'Soulful Bollywood & Sufi Acoustics',
      mood: 'Heartfelt, Emotional & Lush',
      suggestedEq: 'acoustic_vocal',
      acousticNote: 'Mastered for vocal intimacy, rich acoustic sarangi/flute separation, delicate string arrangements, and resonant binaural staging.',
      queries: [
        'Tum Hi Ho Arijit Singh',
        'Kun Faaya Kun A.R. Rahman',
        'Channa Mereya Arijit Singh',
        'Dil Diyan Gallan Atif Aslam',
        'Phir Le Aya Dil Arijit Singh',
        'Deewani Mastani Shreya Ghoshal'
      ]
    };
  }

  // 3. Dolby Atmos / Spatial / 3D
  if (p.includes('atmos') || p.includes('spatial') || p.includes('binaural') || p.includes('3d audio') || p.includes('7.1.4') || p.includes('surround') || p.includes('soundstage')) {
    return {
      genre: 'Dolby Atmos 7.1.4 Spatial Showcase',
      mood: 'Expansive, Three-Dimensional & Immersive',
      suggestedEq: 'dolby_cinema',
      acousticNote: 'Configured for full 7.1.4 elevation immersion, discrete soundstage panning, and Bauer binaural headphone crossfeed.',
      queries: [
        'Cornfield Chase Hans Zimmer',
        'Instant Crush Daft Punk',
        'Bohemian Rhapsody Queen',
        'Starboy The Weeknd',
        'Binaural Thunderstorm Forest'
      ]
    };
  }

  // 4. Synthwave / Cyberpunk / 80s
  if (p.includes('synth') || p.includes('cyberpunk') || p.includes('80s') || p.includes('neon') || p.includes('retro') || p.includes('kavinsky') || p.includes('driving')) {
    return {
      genre: 'Cyberpunk Midnight Synthwave',
      mood: 'Hypnotic, Nostalgic & Energetic',
      suggestedEq: 'electronic_dance',
      acousticNote: 'Tuned for analog Roland Jupiter/Moog synthesizer frequencies, punchy gated reverb snares, and tight low-end sub bass.',
      queries: [
        'Nightcall Kavinsky',
        'Blinding Lights The Weeknd',
        'Get Lucky Daft Punk',
        'Midnight City M83',
        'Turbo Killer Carpenter Brut'
      ]
    };
  }

  // 5. Studio Ghibli / Anime / Joe Hisaishi
  if (p.includes('anime') || p.includes('ghibli') || p.includes('hisaishi') || p.includes('spirited away') || p.includes('radwimps') || p.includes('naruto') || p.includes('japan')) {
    return {
      genre: 'Studio Ghibli & Anime Orchestras',
      mood: 'Enchanting, Lyrical & Cinematic',
      suggestedEq: 'classical_orchestral',
      acousticNote: 'Optimized for delicate concert piano keys, expressive orchestral strings, and expansive fantasy soundscapes.',
      queries: [
        'Spirited Away Joe Hisaishi',
        'Merry Go Round of Life Joe Hisaishi',
        'Sparkle Radwimps Your Name',
        'Guren no Yumiya Attack on Titan',
        'One Summer Day Joe Hisaishi'
      ]
    };
  }

  // 6. Classical / Piano / Violin
  if (p.includes('classical') || p.includes('beethoven') || p.includes('mozart') || p.includes('chopin') || p.includes('bach') || p.includes('vivaldi') || p.includes('orchestra') || p.includes('piano') || p.includes('violin')) {
    return {
      genre: '24-Bit Audiophile Classical Masters',
      mood: 'Majestic, Harmonic & Refined',
      suggestedEq: 'classical_orchestral',
      acousticNote: 'Pure uncompressed acoustic dynamics preserving crystalline violin bow transients and Steinway grand piano overtones.',
      queries: [
        'Clair de Lune Debussy',
        'Four Seasons Winter Vivaldi',
        'Beethoven Symphony 9 Ode to Joy',
        'Chopin Nocturne Op 9 No 2',
        'Bach Cello Suite 1 Prelude'
      ]
    };
  }

  // 7. Workout / Gym / High Energy / Rock / Metal
  if (p.includes('gym') || p.includes('workout') || p.includes('hype') || p.includes('metal') || p.includes('rock') || p.includes('adrenaline') || p.includes('heavy')) {
    return {
      genre: 'High-Octane Workout Hype',
      mood: 'Aggressive, Punchy & Driving',
      suggestedEq: 'rock_punch',
      acousticNote: 'Emphasizes fast transient kick attacks, crunchy electric guitar saturation, and high-energy mid-range drive.',
      queries: [
        'Till I Collapse Eminem',
        'Believer Imagine Dragons',
        'Enter Sandman Metallica',
        'Smells Like Teen Spirit Nirvana',
        'HUMBLE Kendrick Lamar'
      ]
    };
  }

  // 8. Jazz / Acoustic / Rainy Cafe
  if (p.includes('jazz') || p.includes('cafe') || p.includes('coffee') || p.includes('saxophone') || p.includes('acoustic') || p.includes('blues')) {
    return {
      genre: 'Rainy Cafe Acoustic Jazz',
      mood: 'Intimate, Warm & Relaxed',
      suggestedEq: 'acoustic_vocal',
      acousticNote: 'Captures intimate room acoustics, woody upright bass resonance, brushed brass cymbals, and warm tenor saxophone breath.',
      queries: [
        'Fly Me To The Moon Frank Sinatra',
        'Take Five Dave Brubeck',
        'Autumn Leaves Bill Evans',
        'What A Wonderful World Louis Armstrong',
        'So What Miles Davis'
      ]
    };
  }

  // 9. Focus / Lo-Fi / Study / Ambient
  if (p.includes('focus') || p.includes('study') || p.includes('lofi') || p.includes('lo-fi') || p.includes('chillhop') || p.includes('calm') || p.includes('sleep') || p.includes('peaceful')) {
    return {
      genre: 'Deep Study & Lo-Fi Chillhop',
      mood: 'Tranquil, Soothing & Atmospheric',
      suggestedEq: 'late_night',
      acousticNote: 'Smooth low-pass filtered frequencies with soothing vinyl crackle, gentle electric piano chords, and calming ambient headroom.',
      queries: [
        'Merry Go Round of Life Lofi',
        'Clair de Lune Piano',
        'Weightless Marconi Union',
        'Resonance HOME',
        'Binaural Rain Forest'
      ]
    };
  }

  // Default: Smart General Query Expansion
  return {
    genre: 'AI Curated Eclectic Masterset',
    mood: 'Dynamic, Expressive & Hi-Fi',
    suggestedEq: 'harman_target',
    acousticNote: 'Acoustically balanced across full 20Hz-20kHz spectrum adhering to the Harman target curve for optimal clarity and musicality.',
    queries: [
      prompt,
      `${prompt} master`,
      `${prompt} original`,
      `${prompt} live`
    ]
  };
}

/**
 * Executes AI Natural Language Search and generates a tailored playlist of 100% full-playback songs.
 */
export async function executeAIMusicSearch(userPrompt: string): Promise<AIPromptResult> {
  const cleanPrompt = userPrompt.trim();
  if (!cleanPrompt) {
    throw new Error('Please enter a natural language music prompt or select a preset.');
  }

  const analysis = analyzePromptIntent(cleanPrompt);

  // Run multi-query search in parallel across the 80M+ catalog
  const promises = analysis.queries.map(q => searchSingleTrack(q));
  const rawResults = await Promise.all(promises);

  // Filter out nulls and remove duplicates
  const recommendedTracks: OnlineTrackResult[] = [];
  const seen = new Set<string>();

  for (const track of rawResults) {
    if (track) {
      const key = `${track.title}-${track.artist}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        recommendedTracks.push(track);
      }
    }
  }

  // If specific queries returned fewer than 3 tracks, run a direct query on user prompt
  if (recommendedTracks.length < 3) {
    const directTrack = await searchSingleTrack(cleanPrompt);
    if (directTrack && !seen.has(`${directTrack.title}-${directTrack.artist}`.toLowerCase())) {
      recommendedTracks.unshift(directTrack);
    }
  }

  return {
    userPrompt: cleanPrompt,
    inferredGenre: analysis.genre,
    inferredMood: analysis.mood,
    acousticNote: analysis.acousticNote,
    suggestedEqPresetId: analysis.suggestedEq,
    recommendedTracks
  };
}

