export class Item {
  name: string;
  sellIn: number;
  quality: number;

  constructor(name, sellIn, quality) {
    this.name = name;
    this.sellIn = sellIn;
    this.quality = quality;
  }
}

const AGED_BRIE = 'Aged Brie';
const SULFURAS = 'Sulfuras, Hand of Ragnaros';
const BACKSTAGE_PASS = 'Backstage passes to a TAFKAL80ETC concert';
const CONJURED_PREFIX = 'Conjured';

export class GildedRose {
  items: Array<Item>;

  constructor(items = [] as Array<Item>) {
    this.items = items;
  }

  updateQuality(): Array<Item> {
  for (const item of this.items) {
    if (item.name === SULFURAS) continue;

    item.quality = this.QualityChecker(this.getNewQuality(item));
    item.sellIn -= 1;
  }
  return this.items;   // <- loop ke BAHAR, method ke andar
}

  // ASUMPTION: What if an item expired when the sellIn is less than 0 so I will check it if the item is expired or not?
  private ExpiredItem(item: Item): boolean {
    return item.sellIn <= 0;
  }

  // ASSUMPTION: What if because of any reason or any code or bug, the quality of an item is less than 0 or greater than 50(except SULFURAS)? So, I will keep the quality of an item between 0 and 50 with this method.
  private QualityChecker(quality: number): number{
    return Math.max(0, Math.min(50, quality));
  }

  // Writing method to update the quality of a normal item
  // RULE: Once the sell by date has passed, quality degrades twice as fast
  private updateNormalItem(item: Item): number {
    return item.quality - (this.ExpiredItem(item) ? 2 : 1);
  }

  // Writing method to update the quality of Aged Brie
  // RULE: "Aged Brie's quality increases with the passage of time."
  private updateAgedBrie(item: Item): number {
    return item.quality + (this.ExpiredItem(item) ? 2 : 1);
  }

  // Writing method to update the quality of Conjured Items
  // RULE: "Conjured" items degrade in Quality twice as fast as normal items
  private updateConjuredItem(item: Item): number {
    return item.quality - (this.ExpiredItem(item) ? 4 : 2);
  }

  // Writing method to update the quality of Backstage Passes
  // RULE: "Backstage passes", like aged brie, increases in Quality as its SellIn value approaches; Quality increases by 2 when there are 10 days or less and by 3 when there are 5 days or less but Quality drops to 0 after the concert.
  // ASUMPTION: If there are more than 10 days than the quality will increase by 1.
  private updateBackstagePass(item: Item): number{
    if(this.ExpiredItem(item)) return 0;
    if (item.sellIn <= 5) return item.quality + 3;
    if (item.sellIn <= 10) return item.quality + 2;
    return item.quality + 1;
  }

  // Now, writing a method to get the new quality of every item using the above writtern methods.
  private getNewQuality(item: Item): number {
    if (item.name === AGED_BRIE) return this.updateAgedBrie(item);
    if (item.name === BACKSTAGE_PASS) return this.updateBackstagePass(item);
    // ASSUMPTION: any item whose name starts with "Conjured" is a conjured item.
    if (item.name.startsWith(CONJURED_PREFIX)) return this.updateConjuredItem(item);
    return this.updateNormalItem(item);
  }

}
