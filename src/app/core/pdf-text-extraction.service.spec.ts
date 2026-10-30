import {
  PdfTextContent,
  PdfTextExtractionService,
} from './pdf-text-extraction.service';

describe('PdfTextExtractionService', () => {
  it('groups positioned text into blocks and assigns stable page offsets', () => {
    const content = {
      items: [
        {
          str: 'Title',
          transform: [18, 0, 0, 18, 72, 700],
          width: 42,
          height: 18,
          fontName: 'Main-Bold',
          hasEOL: true,
        },
        {
          str: 'First',
          transform: [12, 0, 0, 12, 72, 670],
          width: 25,
          height: 12,
          fontName: 'Main-Regular',
          hasEOL: false,
        },
        {
          str: 'paragraph.',
          transform: [12, 0, 0, 12, 100, 670],
          width: 55,
          height: 12,
          fontName: 'Main-Regular',
          hasEOL: true,
        },
        {
          str: 'continues.',
          transform: [12, 0, 0, 12, 72, 655],
          width: 56,
          height: 12,
          fontName: 'Main-Regular',
          hasEOL: true,
        },
      ],
    } as unknown as PdfTextContent;

    const result = new PdfTextExtractionService().convertPage(0, content);

    expect(result.text).toBe('Title\n\nFirst paragraph. continues.');
    expect(result.blocks.length).toBe(2);
    expect(result.blocks[0]).toEqual(jasmine.objectContaining({
      kind: 'heading',
      text: 'Title',
      startOffset: 0,
      endOffset: 5,
      bold: true,
    }));
    expect(result.blocks[1]).toEqual(jasmine.objectContaining({
      kind: 'paragraph',
      text: 'First paragraph. continues.',
      startOffset: 7,
      endOffset: result.text.length,
    }));
  });

  it('returns an empty page for image-only content', () => {
    const content = { items: [] } as unknown as PdfTextContent;
    expect(new PdfTextExtractionService().convertPage(3, content)).toEqual({
      pageIndex: 3,
      text: '',
      blocks: [],
    });
  });
});
