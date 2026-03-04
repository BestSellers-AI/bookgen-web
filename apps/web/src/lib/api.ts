import { authService } from './auth-service';

export type Book = {
    id: number;
    title: string;
    subtitle: string;
    author: string;
    book_status: string;
    created_at: number;
    customer_id?: number;
    purchase_id?: number;
    step?: number;
    introduction?: string;
    conclusion?: string;
    appendix?: string;
    final_considerations?: string;
    glossary?: string;
    closure?: string;
    resources_references?: string;
    preview_pdf_url?: string;
    pdf_url?: string;
    url?: string;
    extras?: any;
    planning?: string; // Xano says text
    content?: string;
    user_id: number;
};

export type Wallet = {
    id: number;
    user_id: number;
    amount: number;
    created_at: number;
};

const API_URL = process.env.NEXT_PUBLIC_XANO_BOOK_API_URL;

const getHeaders = () => {
    const token = authService.getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

export const getBooks = async (userId?: number): Promise<Book[]> => {
    const url = new URL(`${API_URL}/book`);
    if (userId) {
        url.searchParams.append('user_id', userId.toString());
    }

    const response = await fetch(url.toString(), {
        headers: getHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Xano API Error:', errorData);
        throw new Error('Failed to fetch books');
    }

    const data = await response.json();
    // console.log('Xano Response Data:', data);

    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as any).items)) return (data as any).items;
    if (data && typeof data === 'object' && Array.isArray((data as any).data)) return (data as any).data;

    return [];
};

export const getBookById = async (id: string | number): Promise<Book> => {
    const response = await fetch(`${API_URL}/book/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch book details');
    }

    return response.json();
};

export const generatePreview = async (briefing: string, mode: 'manual' | 'ai', title?: string, subtitle?: string, author?: string, userId?: number) => {
    const response = await fetch(`${API_URL}/generate_preview`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            briefing,
            mode,
            title,
            subtitle,
            author,
            user_id: userId ? Number(userId) : undefined
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to generate preview: ${response.statusText}`);
    }

    const data = await response.json();
    // Xano wraps the n8n call: { response: { request, response: { result, status } } }
    const result = data?.response?.response?.result ?? data?.response ?? data;
    return result;
};

export const createBook = async (previewData: any, userId?: number) => {
    const response = await fetch(`${API_URL}/book`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            title: previewData.title,
            subtitle: previewData.subtitle,
            author: previewData.author || "Unknown",
            book_status: 'draft',
            planning: JSON.stringify(previewData.planning),
            ...(userId ? { user_id: userId } : {})
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create book in Xano');
    }

    const newBook = await response.json();
    return { success: true, bookId: newBook.id };
};
export const deleteBook = async (id: string | number) => {
    const response = await fetch(`${API_URL}/book/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete book');
    }

    return { success: true };
};

export const getWallet = async (userId: number): Promise<Wallet | null> => {
    const url = new URL(`${API_URL}/wallet`);
    url.searchParams.append('user_id', userId.toString());

    const response = await fetch(url.toString(), {
        headers: getHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Xano Wallet API Error:', errorData);
        return null;
    }

    const data = await response.json();
    
    // Xano might return an array or a single object depending on the endpoint setup
    if (Array.isArray(data)) return data[0] || null;
    
    // If Xano returns { items: [...] } or { data: [...] }
    if (data && typeof data === 'object') {
        if (Array.isArray((data as any).items)) return (data as any).items[0] || null;
        if (Array.isArray((data as any).data)) return (data as any).data[0] || null;
    }

    return data;
};

export type GenerateFullBookResult = {
    result: 'generating' | 'not_enough_credits';
};

export const generateFullBook = async (bookId: string | number): Promise<GenerateFullBookResult> => {
    const response = await fetch(`${API_URL}/generate_full_book`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ book_id: Number(bookId) }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to generate full book');
    }

    return response.json();
};
