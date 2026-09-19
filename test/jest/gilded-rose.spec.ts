import { Item, GildedRose } from '@/gilded-rose';

// Item names with special rules (same strings as in the app code).
const BRIE = 'Aged Brie';
const SULFURAS = 'Sulfuras, Hand of Ragnaros';
const PASS = 'Backstage passes to a TAFKAL80ETC concert';
const CONJURED = 'Conjured Mana Cake';

// Test helper: creates a shop with ONE item, runs a single day of updateQuality(),
// and returns the updated item.
const update = (name: string, sellIn: number, quality: number): Item => {
  const gildedRose = new GildedRose([new Item(name, sellIn, quality)]);
  return gildedRose.updateQuality()[0];
};

describe('Gilded Rose', () => {
  // ---------- General shop behaviour ----------

  it('works with an empty shop', () => {
    // The default constructor argument is an empty list, so nothing should crash.
    expect(new GildedRose().updateQuality()).toEqual([]);
  });

  it('keeps the item name unchanged', () => {
    // updateQuality must only touch sellIn and quality, never the name.
    expect(update('foo', 5, 10).name).toBe('foo');
  });

  it('updates every item in the list', () => {
    // Normal item: 10 -> 9, Aged Brie: 10 -> 11.
    const gildedRose = new GildedRose([new Item('foo', 5, 10), new Item(BRIE, 5, 10)]);
    const items = gildedRose.updateQuality();
    expect(items.map((i) => i.quality)).toEqual([9, 11]);
  });

  // ---------- Normal items ----------

  describe('normal item', () => {
    it('decreases sellIn and quality by 1', () => {
      const item = update('foo', 5, 10);
      expect(item.sellIn).toBe(4);
      expect(item.quality).toBe(9);
    });

    it('decreases quality twice as fast after sellIn expires', () => {
      // sellIn = 0 means the sell-by date has passed, so quality drops by 2.
      expect(update('foo', 0, 10).quality).toBe(8);
    });

    it('never has negative quality', () => {
      // Already at 0 (before and after expiry), and 1 with a -2 penalty: all must stay at 0.
      expect(update('foo', 5, 0).quality).toBe(0);
      expect(update('foo', 0, 1).quality).toBe(0);
    });

    it('allows sellIn to go negative', () => {
      // sellIn keeps decreasing after the sell-by date; only quality has a lower limit.
      expect(update('foo', 0, 10).sellIn).toBe(-1);
    });
  });

  // ---------- Aged Brie ----------

  describe('Aged Brie', () => {
    it('increases quality by 1', () => {
      expect(update(BRIE, 5, 10).quality).toBe(11);
    });

    it('increases quality by 2 after sellIn expires', () => {
      expect(update(BRIE, 0, 10).quality).toBe(12);
    });

    it('never exceeds quality 50', () => {
      // Already at max, and 49 with a +2 bonus (would be 51): both must be capped at 50.
      expect(update(BRIE, 5, 50).quality).toBe(50);
      expect(update(BRIE, 0, 49).quality).toBe(50);
    });
  });

  // ---------- Sulfuras (legendary) ----------

  describe('Sulfuras', () => {
    it('never changes quality or sellIn', () => {
      // Legendary item: quality stays 80 and it never has to be sold.
      const item = update(SULFURAS, 5, 80);
      expect(item.quality).toBe(80);
      expect(item.sellIn).toBe(5);
    });

    it('does not change even when sellIn is negative', () => {
      // Covers the case where the sell-by date has "passed": still no change.
      const item = update(SULFURAS, -1, 80);
      expect(item.quality).toBe(80);
      expect(item.sellIn).toBe(-1);
    });
  });

  // ---------- Backstage passes ----------

  describe('Backstage passes', () => {
    // The boundaries 11 / 10 / 6 / 5 / 1 / 0 are tested on purpose,
    // because off-by-one mistakes usually happen exactly there.

    it('increases by 1 when more than 10 days left', () => {
      expect(update(PASS, 11, 20).quality).toBe(21);
    });

    it('increases by 2 when 10 days left', () => {
      expect(update(PASS, 10, 20).quality).toBe(22);
    });

    it('increases by 2 when 6 days left', () => {
      expect(update(PASS, 6, 20).quality).toBe(22);
    });

    it('increases by 3 when 5 days left', () => {
      expect(update(PASS, 5, 20).quality).toBe(23);
    });

    it('increases by 3 when 1 day left', () => {
      expect(update(PASS, 1, 20).quality).toBe(23);
    });

    it('drops to 0 after the concert', () => {
      expect(update(PASS, 0, 20).quality).toBe(0);
    });

    it('never exceeds quality 50', () => {
      // Each case would go above 50 without the cap (+1, +2, +3 respectively).
      expect(update(PASS, 11, 50).quality).toBe(50);
      expect(update(PASS, 10, 49).quality).toBe(50);
      expect(update(PASS, 5, 49).quality).toBe(50);
    });

    it('follows the full lifecycle over multiple days', () => {
      // Simulates 12 days for a pass starting at sellIn 11 / quality 10.
      // Expected: +1 (day 1), +2 for the next 5 days, +3 for the next 5 days,
      // then quality drops to 0 once the concert has passed.
      const gildedRose = new GildedRose([new Item(PASS, 11, 10)]);
      const seen: number[] = [];
      for (let day = 0; day < 12; day++) {
        gildedRose.updateQuality();
        seen.push(gildedRose.items[0].quality);
      }
      expect(seen).toEqual([11, 13, 15, 17, 19, 21, 24, 27, 30, 33, 36, 0]);
    });
  });

  // ---------- Conjured items (the new feature) ----------

  describe('Conjured items', () => {
    it('degrade twice as fast as normal items', () => {
      // Normal would be 10 -> 9, Conjured is 10 -> 8.
      expect(update(CONJURED, 5, 10).quality).toBe(8);
    });

    it('degrade by 4 after sellIn expires', () => {
      // Normal items lose 2 after expiry, so conjured lose 4.
      expect(update(CONJURED, 0, 10).quality).toBe(6);
    });

    it('never have negative quality', () => {
      // 1 - 2 and 3 - 4 would be negative without the lower limit.
      expect(update(CONJURED, 5, 1).quality).toBe(0);
      expect(update(CONJURED, 0, 3).quality).toBe(0);
    });
  });
});