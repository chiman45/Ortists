import { GalleryListing, FeaturedArtist } from "./types";

export const GALLERY_CATEGORIES = [
  "All", "Oil Painting", "Digital Art", "Typography",
  "Illustrations", "Sculpture", "Photography",
];

// keep old export name for backward-compat
export const Gallery_CATEGORIES = GALLERY_CATEGORIES;

const ARTISTS = [
  // Indices map directly to GalleryListings[i] — artist can appear on multiple works
  { name: "Mara Voss",        loc: "Berlin, Germany",      avatar: "https://i.pravatar.cc/80?img=47", rating: 4.9, commissions: 47 },
  { name: "Mara Voss",        loc: "Berlin, Germany",      avatar: "https://i.pravatar.cc/80?img=47", rating: 4.9, commissions: 47 },
  { name: "Lena Kowalski",    loc: "Warsaw, Poland",       avatar: "https://i.pravatar.cc/80?img=9",  rating: 4.9, commissions: 89 },
  { name: "Samuel Osei",      loc: "Accra, Ghana",         avatar: "https://i.pravatar.cc/80?img=13", rating: 4.8, commissions: 62 },
  { name: "Ingrid Halvorsen", loc: "Oslo, Norway",         avatar: "https://i.pravatar.cc/80?img=16", rating: 4.7, commissions: 31 },
  { name: "Theo Blanchard",   loc: "Lyon, France",         avatar: "https://i.pravatar.cc/80?img=20", rating: 4.6, commissions: 24 },
  { name: "Ryo Tanaka",       loc: "Kyoto, Japan",         avatar: "https://i.pravatar.cc/80?img=22", rating: 4.8, commissions: 29 },
  { name: "Aisha Diallo",     loc: "Dakar, Senegal",       avatar: "https://i.pravatar.cc/80?img=25", rating: 4.9, commissions: 53 },
  { name: "Sofia Reyes",      loc: "Mexico City, Mexico",  avatar: "https://i.pravatar.cc/80?img=5",  rating: 4.9, commissions: 36 },
  { name: "Clara Müller",     loc: "Vienna, Austria",      avatar: "https://i.pravatar.cc/80?img=39", rating: 4.8, commissions: 19 },
  { name: "Samuel Osei",      loc: "Accra, Ghana",         avatar: "https://i.pravatar.cc/80?img=13", rating: 4.8, commissions: 62 },
  { name: "Kenji Mori",       loc: "Tokyo, Japan",         avatar: "https://i.pravatar.cc/80?img=44", rating: 4.7, commissions: 38 },
  { name: "Nadia Ferreira",   loc: "São Paulo, Brazil",    avatar: "https://i.pravatar.cc/80?img=33", rating: 5.0, commissions: 11 },
  { name: "Lena Kowalski",    loc: "Warsaw, Poland",       avatar: "https://i.pravatar.cc/80?img=9",  rating: 4.9, commissions: 89 },
];

const ARTWORK_TITLES = [
  "The Long Light", "Chromatic Dreams", "Abstract No. 7", "Portrait of Elise",
  "Cerulean Study", "Still Waters", "Warm Passage", "Botanical Study",
  "Composition in Blue", "Verdant", "Forest Light", "Form Study",
  "Untitled Dusk", "Golden Hour", "Riverside Study", "Still Life II",
  "Clay Form No. 12", "Meridian Blue", "Edge of Season", "Quiet Interior",
  "The Pale Room", "Late Afternoon", "Figure in Red", "Open Field",
];

const PRICES = [
  680, 420, 618, 480, 180, 260, 340, 360,
  460, 280, 285, 175, 620, 290, 320, 205,
  890, 390, 440, 155, 720, 310, 540, 195,
];

const CATEGORIES = [
  "Oil Painting", "Digital Art", "Portraits", "Illustrations",
  "Sculpture", "Photography", "Oil Painting", "Illustrations",
  "Oil Painting", "Digital Art", "Landscape", "Figure Drawing",
  "Contemporary", "Photography", "Digital Art", "Oil Painting",
  "Sculpture", "Digital Art", "Oil Painting", "Illustrations",
  "Portraits", "Photography", "Oil Painting", "Digital Art",
];

const MEDIUMS = [
  "Oil on canvas", "Digital illustration", "Oil on linen", "Oil on canvas",
  "Acrylic on board", "Mixed media", "Oil on panel", "Oil on canvas",
  "Oil on canvas", "Acrylic on canvas", "Oil on board", "Charcoal",
  "Mixed media", "Photography", "Digital", "Oil on canvas",
  "Ceramic", "Digital illustration", "Oil on canvas", "Watercolor",
  "Oil on linen", "Photography", "Oil on canvas", "Digital",
];

// Public-domain paintings via Wikimedia Commons (Special:FilePath redirects to CDN thumbnail)
const W = (f: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${f}?width=800`;
const ART_IMAGES = [
  W("Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"),
  W("1665_Girl_with_a_Pearl_Earring.jpg"),
  W("The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg"),
  W("Katsushika_Hokusai_-_Thirty-Six_Views_of_Mount_Fuji-_The_Great_Wave_Off_the_Coast_of_Kanagawa_-_Google_Art_Project.jpg"),
  W("Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg"),
  W("Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg"),
  W("Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg"),
  W("Edgar_Degas_-_The_Dance_Class_-_Google_Art_Project.jpg"),
  W("Pierre-Auguste_Renoir%2C_Le_Moulin_de_la_Galette.jpg"),
  W("A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg"),
  W("Monet_-_Impression%2C_Sunrise.jpg"),
  W("Turner_-_The_Fighting_Temeraire%2C_National_Gallery.jpg"),
  W("Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg"),
  W("John_Singer_Sargent_-_Carnation%2C_Lily%2C_Lily%2C_Rose_-_Google_Art_Project.jpg"),
  W("Mary_Cassatt_-_Children_Playing_on_the_Beach_-_Google_Art_Project.jpg"),
  W("Frederic_Leighton_-_Flaming_June%2C_1895.jpg"),
  W("Camille_Pissarro_-_Boulevard_Montmartre%2C_Mardi_Gras_-_Google_Art_Project.jpg"),
  W("Michelangelo_Caravaggio_-_Judith_Beheading_Holofernes_-_WGA04127.jpg"),
  W("Diego_Vel%C3%A1zquez_-_Las_Meninas_-_Google_Art_Project.jpg"),
  W("Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg"),
  W("Rembrandt_van_Rijn_-_De_Nachtwacht.jpg"),
  W("Raphael_-_School_of_Athens_-_Google_Art_Project.jpg"),
  W("Paul_C%C3%A9zanne_-_The_Large_Bathers_-_Google_Art_Project.jpg"),
  W("Gustave_Courbet_-_A_Burial_at_Ornans_-_Google_Art_Project_2.jpg"),
];

const COMMENTS = [47, 42, 38, 12, 22, 31, 18, 47, 29, 35, 28, 30, 50, 43, 47, 42, 48, 19, 34, 11, 28, 37, 24, 16];

export const GalleryListings: GalleryListing[] = ARTWORK_TITLES.map((title, i) => {
  const artist = ARTISTS[i % ARTISTS.length];
  return {
    id:             `g${i + 1}`,
    type:           "artwork",
    imageUrl:       ART_IMAGES[i] ?? ART_IMAGES[i % ART_IMAGES.length],
    title,
    artistName:     artist.name,
    artistLocation: artist.loc,
    avatar:         artist.avatar,
    price:          PRICES[i],
    currency:       "£",
    category:       CATEGORIES[i],
    medium:         MEDIUMS[i],
    dimensions:     ["40×60 cm", "60×80 cm", "A3 print", "24×36 in", "Digital file"][i % 5],
    likes:          ((i * 13 + 7) * 31) % 2000 + 50,
    comments:       COMMENTS[i],
    commissions:    artist.commissions,
    rating:         artist.rating,
    saved:          false,
    tags:           [["abstract", "modern"], ["digital"], ["portrait"], ["illustration"]][i % 4],
    description:    "A stunning piece that explores the boundaries of form and colour, created with meticulous attention to detail and artistic vision.",
    physical:       i % 3 !== 0,
    commissionOpen: i % 4 === 0,
  };
});

// 8 unique artists for the ARTISTS TO WATCH row
const WATCH_ARTISTS = [
  ARTISTS[0],  // Mara Voss
  ARTISTS[3],  // Samuel Osei
  ARTISTS[4],  // Ingrid Halvorsen
  ARTISTS[2],  // Lena Kowalski
  ARTISTS[5],  // Theo Blanchard
  ARTISTS[7],  // Aisha Diallo
  ARTISTS[9],  // Clara Müller
  ARTISTS[11], // Kenji Mori
];

export const featuredArtists: FeaturedArtist[] = WATCH_ARTISTS.map((a, i) => ({
  id:           `fa${i + 1}`,
  name:         a.name,
  username:     a.name.toLowerCase().replace(/\s+/g, "_"),
  avatar:       a.avatar,
  specialty:    CATEGORIES[i % CATEGORIES.length],
  listingsCount:(i + 1) * 3 + 4,
  followers:    ((i + 1) * 1237) % 9000 + 500,
  commissions:  a.commissions,
  rating:       a.rating,
  location:     a.loc,
}));

export const trendingListings = GalleryListings.slice(0, 8);

// Hero = first item; featured editorial grid = items 1-3; new row = 4-7; collection = item 8; main grid = rest
export const heroListing      = GalleryListings[0];
export const featuredGrid     = GalleryListings.slice(1, 4);
export const newListings       = GalleryListings.slice(4, 8);
export const collectionFeatured = GalleryListings[8];
export const mainGrid         = GalleryListings.slice(9, 17);
