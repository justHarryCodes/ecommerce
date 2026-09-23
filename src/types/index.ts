// ═══════════════════════════════════════════
// Global TypeScript Types
// Storefront components receive raw DB rows (snake_case).
// Dashboard components receive toCamel'd rows (camelCase).
// Both sets of field names are typed as optional to allow both usage patterns.
// ═══════════════════════════════════════════

export interface Store {
  id: string
  // camelCase (from toCamel / dashboard)
  ownerId?: string
  userId?: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  logo_url?: string   // raw DB (storefront)
  phone?: string
  whatsapp?: string
  primaryCategory?: string
  primary_category?: string
  // Theme — camelCase
  themeMode?: 'light' | 'dark' | 'both'
  accentColor?: string
  storefrontThemeMode?: 'light' | 'dark' | 'both'
  storefrontAccentColor?: string
  // Theme — snake_case (raw DB / storefront)
  theme_mode?: 'light' | 'dark' | 'both'
  accent_color?: string
  storefront_theme_mode?: 'light' | 'dark' | 'both'
  storefront_accent_color?: string
  // Payment — camelCase
  paymentPreference?: 'paystack' | 'bank_transfer' | 'both'
  paymentMethods?: ('paystack' | 'transfer')[]
  bankName?: string
  accountNumber?: string
  accountName?: string
  bankAccountNumber?: string
  bankAccountName?: string
  paystackPublicKey?: string
  // Payment — snake_case (raw DB / storefront)
  payment_preference?: 'paystack' | 'bank_transfer' | 'both'
  bank_name?: string
  bank_account_number?: string
  bank_account_name?: string
  paystack_public_key?: string
  isActive?: boolean
  is_active?: boolean
  // Subscription / billing
  status?: string
  subscriptionStatus?: string
  subscription_status?: string
  setupFeePaidAt?: string | null
  setup_fee_paid_at?: string | null
  subscriptionExpiresAt?: string | null
  subscription_expires_at?: string | null
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  // Storefront customisation
  banner_images?: string[]
  bannerImages?: string[]
  featured_product_ids?: string[]
  featuredProductIds?: string[]
  // Return policy
  return_policy?: string
  returnPolicy?: string
  // Referral
  referral_code?: string
  referralCode?: string
  referral_credits?: number
  referralCredits?: number
  // Company profile (single-company mode — migrations/002_company_pivot.sql)
  email?: string
  address?: string
  businessHours?: Record<string, string>
  business_hours?: Record<string, string>
  mapEmbedUrl?: string
  map_embed_url?: string
  socialLinks?: Record<string, string>
  social_links?: Record<string, string>
  vision?: string
  mission?: string
}

export interface Category {
  id: string
  storeId?: string
  store_id?: string
  parentId?: string | null
  parent_id?: string | null
  name: string
  slug: string
  sortOrder?: number
  sort_order?: number
  subcategories?: Category[]
  createdAt?: string
  created_at?: string
}

export interface Product {
  id: string
  storeId?: string
  store_id?: string
  categoryId?: string
  category_id?: string
  subcategoryId?: string
  subcategory_id?: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  short_description?: string
  // Price is optional — the catalog can show a fixed price, a "from ₦X"
  // note, or nothing at all ("Request a quote").
  price?: number
  comparePrice?: number
  compare_price?: number
  priceNote?: string
  price_note?: string
  // Zone-based delivery fees for this specific product — some items cost
  // more to deliver than others (e.g. bulky furniture vs. small fittings),
  // and interstate delivery usually costs more than within the state.
  deliveryFeeWithinState?: number
  delivery_fee_within_state?: number
  deliveryFeeInterstate?: number
  delivery_fee_interstate?: number
  // Free-text delivery estimate, e.g. "3-5 business days" or "2 weeks — made to order".
  deliveryTimeline?: string
  delivery_timeline?: string
  stockQuantity?: number
  stock_quantity?: number
  imageUrl?: string
  image_url?: string
  images?: string[]
  isActive?: boolean
  is_active?: boolean
  isFeatured?: boolean
  is_featured?: boolean
  // Purchase mode — true: fixed-price, "Add to Cart" + real checkout.
  // false (default): "Request a Quote" only, no price required.
  isPurchasable?: boolean
  is_purchasable?: boolean
  sortOrder?: number
  sort_order?: number
  // Catalog options
  sizeOptions?: string[]
  size_options?: string[]
  materialOptions?: string[]
  material_options?: string[]
  colorOptions?: string[]
  color_options?: string[]
  // Joined fields
  category_name?: string
  category_slug?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

// ═══════════════════════════════════════════
// Company-pivot content types (migrations/002_company_pivot.sql)
// Same dual camelCase/snake_case convention as above.
// ═══════════════════════════════════════════

export interface Service {
  id: string
  storeId?: string
  store_id?: string
  name: string
  slug: string
  shortDescription?: string
  short_description?: string
  description?: string
  icon?: string
  imageUrl?: string
  image_url?: string
  benefits?: string[]
  relatedProductIds?: string[]
  related_product_ids?: string[]
  isActive?: boolean
  is_active?: boolean
  sortOrder?: number
  sort_order?: number
  createdAt?: string
  created_at?: string
}

export type ProjectCategory = 'residential' | 'commercial' | 'hotels' | 'schools' | 'offices' | 'restaurants'

export interface Project {
  id: string
  storeId?: string
  store_id?: string
  title: string
  slug: string
  category: ProjectCategory
  location?: string
  description?: string
  servicesProvided?: string[]
  services_provided?: string[]
  beforeImages?: string[]
  before_images?: string[]
  afterImages?: string[]
  after_images?: string[]
  images?: string[]
  isFeatured?: boolean
  is_featured?: boolean
  sortOrder?: number
  sort_order?: number
  createdAt?: string
  created_at?: string
}

export type GalleryFilterCategory = 'metal' | 'aluminum_glass' | 'wood' | 'decorative_concrete' | 'interior' | 'exterior'

export interface GalleryItem {
  id: string
  storeId?: string
  store_id?: string
  title?: string
  mediaType?: 'image' | 'video'
  media_type?: 'image' | 'video'
  mediaUrl?: string
  media_url?: string
  thumbnailUrl?: string
  thumbnail_url?: string
  filterCategory: GalleryFilterCategory
  filter_category?: GalleryFilterCategory
  sortOrder?: number
  sort_order?: number
  createdAt?: string
  created_at?: string
}

export interface BlogPost {
  id: string
  storeId?: string
  store_id?: string
  title: string
  slug: string
  excerpt?: string
  content: string
  coverImage?: string
  cover_image?: string
  category?: string
  author?: string
  isPublished?: boolean
  is_published?: boolean
  publishedAt?: string | null
  published_at?: string | null
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship'

export interface JobPosting {
  id: string
  storeId?: string
  store_id?: string
  title: string
  slug: string
  department?: string
  location?: string
  employmentType?: EmploymentType
  employment_type?: EmploymentType
  description?: string
  requirements?: string
  isInternship?: boolean
  is_internship?: boolean
  isActive?: boolean
  is_active?: boolean
  createdAt?: string
  created_at?: string
}

export type JobApplicationStatus = 'new' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'

export interface JobApplication {
  id: string
  jobPostingId?: string
  job_posting_id?: string
  storeId?: string
  store_id?: string
  applicantName?: string
  applicant_name?: string
  email: string
  phone?: string
  resumeUrl?: string
  resume_url?: string
  coverNote?: string
  cover_note?: string
  status?: JobApplicationStatus
  createdAt?: string
  created_at?: string
  // Joined
  jobTitle?: string
  job_title?: string
}

export interface Testimonial {
  id: string
  storeId?: string
  store_id?: string
  customerName?: string
  customer_name?: string
  customerTitle?: string
  customer_title?: string
  quote: string
  rating?: number
  photoUrl?: string
  photo_url?: string
  isFeatured?: boolean
  is_featured?: boolean
  sortOrder?: number
  sort_order?: number
  createdAt?: string
  created_at?: string
}

export type QuoteRequestSourceType = 'product' | 'service' | 'project' | 'contact_form' | 'general'
export type QuoteRequestStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost'

export interface Customer {
  id: string
  storeId?: string
  store_id?: string
  firebaseUid?: string
  firebase_uid?: string
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  // Joined (dashboard customer list)
  orderCount?: number
  order_count?: number
  totalSpent?: number
  total_spent?: number
}

export interface QuoteRequest {
  id: string
  storeId?: string
  store_id?: string
  name: string
  email?: string
  phone: string
  message?: string
  sourceType?: QuoteRequestSourceType
  source_type?: QuoteRequestSourceType
  sourceId?: string | null
  source_id?: string | null
  sourceName?: string
  source_name?: string
  status?: QuoteRequestStatus
  adminNote?: string
  admin_note?: string
  createdAt?: string
  created_at?: string
}

export interface ReelProduct {
  product_id: string
  name: string
  price: number
  image_url: string | null
  slug: string | null
  stock_quantity: number
}

export interface Reel {
  id: string
  store_id: string
  title: string | null
  description: string | null
  cloudinary_public_id: string
  video_url: string
  thumbnail_url: string | null
  duration_seconds: number | null
  view_count: number
  share_count: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  // Joined
  products?: ReelProduct[]
  store_name?: string
  store_slug?: string
  store_logo?: string | null
}

export interface OrderItem {
  id: string
  orderId?: string
  order_id?: string
  productId?: string
  product_id?: string
  productName?: string
  product_name?: string
  productImage?: string
  product_image?: string
  price: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  storeId?: string
  store_id?: string
  customerId?: string | null
  customer_id?: string | null
  orderNumber?: string
  order_number?: string
  customerName?: string
  customer_name?: string
  customerEmail?: string
  customer_email?: string
  customerPhone?: string
  customer_phone?: string
  deliveryAddress?: string
  delivery_address?: string
  deliveryCity?: string
  delivery_city?: string
  deliveryState?: string
  delivery_state?: string
  deliveryNote?: string
  delivery_note?: string
  subtotal?: number
  deliveryFee?: number
  delivery_fee?: number
  totalAmount?: number
  total_amount?: number
  total?: number
  paymentMethod?: string
  payment_method?: string
  paymentStatus?: string
  payment_status?: string
  paymentReference?: string
  payment_reference?: string
  orderStatus?: string
  order_status?: string
  notes?: string
  items?: OrderItem[]
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

// Cart (client-side only)
export interface CartItem {
  product_id: string
  name: string
  price: number
  image_url?: string
  stock_quantity: number
  quantity: number
}

// API responses
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export const PRIMARY_CATEGORIES = [
  'Fashion and Clothing',
  'Shoes and Sneakers',
  'Bags and Accessories',
  'Beauty and Makeup',
  'Hair and Wigs',
  'Food and Catering',
  'Electronics and Gadgets',
  'Phones and Accessories',
  'Laptops and Computing',
  'Furniture and Home',
  'Artwork and Paintings',
  'Jewelry and Watches',
  'Books and Stationery',
  'Other',
] as const

export type PrimaryCategory = typeof PRIMARY_CATEGORIES[number]

export interface SessionUser {
  firebaseUid: string
  email: string
  displayName?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'pending_confirmation' | 'paid' | 'failed' | 'refunded' | 'rejected'

