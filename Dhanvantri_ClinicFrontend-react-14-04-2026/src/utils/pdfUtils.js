import { API_URL } from '../config/config';
const UNICODE_FONT_URLS = [
    '/fonts/NotoSans-Regular.ttf',
    'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf'
];
let unicodeFontCachePromise = null;
/**
 * Adds a professional clinic header with logo to a jsPDF instance
 */
export const addClinicHeader = async (doc, clinic, title) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let textX = 15; // Default X if no logo
    // Add Logo if available or use Fallback
    const baseUrl = API_URL.replace(/\/api$/, '');
    const logoSource = clinic?.logo
        ? (clinic.logo.startsWith('http') ? clinic.logo : `${baseUrl}${clinic.logo.startsWith('/') ? clinic.logo : `/${clinic.logo}`}`)
        : '/sidebar-logo.jpg';
    try {
        const logoAdded = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                try {
                    const imgWidth = 25;
                    const imgHeight = (img.height * imgWidth) / img.width;
                    const finalHeight = Math.min(imgHeight, 20);
                    doc.addImage(img, 'PNG', 15, 12, imgWidth, finalHeight, undefined, 'FAST');
                    resolve(true);
                }
                catch (e) {
                    console.warn("Failed to add image to PDF", e);
                    resolve(false);
                }
            };
            img.onerror = () => {
                console.warn("Failed to load logo for PDF:", logoSource);
                resolve(false);
            };
            img.src = logoSource + (logoSource.includes('?') ? '&' : '?') + `t=${new Date().getTime()}`;
        });
        if (logoAdded) {
            textX = 48; // Shift text to the right if logo exists
        }
    }
    catch (e) {
        console.warn("Error processing logo", e);
    }
    // Clinic Name
    doc.setFontSize(20);
    doc.setTextColor(30, 27, 75); // #1e1b4b
    doc.setFont('helvetica', 'bold');
    doc.text(clinic?.name || 'Dhanvantri Hospital', textX, 22);
    // Title / Report Type
    doc.setFontSize(13);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(title, textX, 29);
    // Clinic Contact Info
    doc.setFontSize(9);
    doc.setTextColor(120);
    let contactInfo = clinic?.location || '';
    if (clinic?.contact)
        contactInfo += ` | Tel: ${clinic.contact}`;
    if (clinic?.email)
        contactInfo += ` | Email: ${clinic.email}`;
    // Split contact info if it's too long
    const splitContact = doc.splitTextToSize(contactInfo, pageWidth - textX - 15);
    doc.text(splitContact, textX, 35);
    // Horizontal Line
    doc.setDrawColor(226, 232, 240); // Matches dashboard border color
    doc.setLineWidth(0.5);
    doc.line(15, 42, pageWidth - 15, 42);
    return 50; // Return next Y position
};

/**
 * Ensures a Unicode-capable font is registered for rupee and other symbols.
 * Falls back silently if the font cannot be loaded.
 */
export const ensureUnicodeFont = async (doc) => {
    if (!doc)
        return false;
    if (!unicodeFontCachePromise) {
        unicodeFontCachePromise = (async () => {
            let buffer = null;
            for (const url of UNICODE_FONT_URLS) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        continue;
                    }
                    buffer = await response.arrayBuffer();
                    break;
                }
                catch {
                    continue;
                }
            }
            if (!buffer) {
                throw new Error('Unicode font download failed');
            }
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i += 1) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        })().catch(() => null);
    }
    const base64Font = await unicodeFontCachePromise;
    if (!base64Font) {
        return false;
    }
    try {
        doc.addFileToVFS('NotoSans-Regular.ttf', base64Font);
        doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
        doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'bold');
        doc.setFont('NotoSans', 'normal');
        return true;
    }
    catch {
        return false;
    }
};
