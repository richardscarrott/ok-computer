import {
  and,
  array,
  assert,
  exists,
  Infer,
  instanceOf,
  integer,
  is,
  length,
  min,
  minLength,
  nullish,
  number,
  object,
  okay,
  oneOf,
  or,
  string
} from 'ok-computer';
import { pickRandom, randomNumber, uuid } from './utils';

const price = object({
  amount: and(integer, min(0)),
  currency: oneOf('USD' as const, 'GBP' as const, 'EUR' as const)
});

type Price = Infer<typeof price>;

const product = object({
  id: and(string, length(11)),
  createdAt: instanceOf(Date),
  name: and(string, length(1, 500)),
  brand: or(nullish, and(string, length(1, 250))),
  price,
  inventory: integer
});

type Product = Infer<typeof product>;

const sum = (a: unknown, b: unknown) => {
  assert(a, number);
  assert(b, number);
  return a + b;
};

const sumPrices = (a: Price, b: Price) => {
  assert(a, price);
  assert(b, price);
  assert(a.currency, is(b.currency));
  return {
    amount: sum(a.amount, b.amount),
    currency: a.currency
  };
};

const getCurrencySymbol = (currency: Price['currency']) => {
  const currencySymbol = new Map([
    ['USD', '$'],
    ['GBP', '£'],
    ['EUR', '€']
  ]).get(currency);
  assert(currencySymbol, exists);
  return currencySymbol;
};

const formatPrice = (p: Price) => {
  assert(p, price);
  return `${getCurrencySymbol(p.currency)}${(p.amount / 100).toFixed(2)}`;
};

interface CreateProductOptions {
  readonly name: string;
  readonly brand?: string;
  readonly price: Price;
  readonly inventory: number;
}

const createProduct = ({
  name,
  brand,
  inventory,
  price
}: CreateProductOptions) => {
  const newProduct: Product = {
    id: `prod_${uuid()}`,
    createdAt: new Date(),
    name,
    brand,
    price,
    inventory
  };
  assert(newProduct, product);
  return newProduct;
};

const totalCart = (cart: Product[]) => {
  assert(cart, minLength(1));
  return cart.reduce<Price>(
    (total, product) => sumPrices(total, product.price),
    { amount: 0, currency: cart[0].price.currency }
  );
};

const getCatalog = (): unknown =>
  Array.from({ length: 10 }).map((_, i) =>
    createProduct({
      name: `Product ${i}`,
      brand: pickRandom(['Apple', 'Samsung']),
      inventory: Math.round(randomNumber(0, 500)),
      price: {
        amount: Math.round(randomNumber(10000, 60000)),
        currency: 'USD'
      }
    })
  );

const getCart = (): unknown => {
  const catalog = getCatalog();
  assert(catalog, array(product));
  return Array.from({ length: Math.round(randomNumber(1, 3)) }).map(() =>
    pickRandom(catalog)
  );
};

const main = async () => {
  const cart = getCart();
  if (okay(cart, and(array(product), minLength(1)))) {
    console.log(cart);
    console.log(`Cart total ${formatPrice(totalCart(cart))} 🛍`);
  } else {
    console.warn('Received invalid cart 🚨');
  }
};

main();
