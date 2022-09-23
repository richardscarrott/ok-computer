import express from 'express';
import {
  and,
  integer,
  length,
  max,
  min,
  minLength,
  nullish,
  object,
  oneOf,
  or,
  string
} from 'ok-computer';
import { query, body, params, errorHandler, errorLogger } from './middleware';

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(express.json());

// curl -i "http://localhost:3000/api/params/1234567890"
app.get(
  '/api/params/:id',
  params(object({ id: and(string, length(10)) })),
  (req, res) => {
    res.json({
      id: req.params.id
    });
  }
);

// curl -i "http://localhost:3000/api/query?sort=ASC"
app.get(
  '/api/query',
  query(object({ sort: oneOf('ASC' as const, 'DESC' as const) })),
  (req, res) => {
    res.json({
      sort: req.query.sort
    });
  }
);

// curl -i -X POST "http://localhost:3000/api/body" -H 'Content-Type: application/json' -d '{ "name": "Lewis Hamilton", "car": 44 }'
app.post(
  '/api/body',
  body(
    object({
      name: and(string, minLength(1)),
      car: or(nullish, and(integer, min(1), max(99)))
    })
  ),
  (req, res) => {
    res.json({
      name: req.body.name,
      car: req.body.car
    });
  }
);

// curl -i -X POST "http://localhost:3000/api/all/1234567890?sort=ASC" -H 'Content-Type: application/json' -d '{ "name": "Lewis Hamilton", "car": 44 }'
app.post(
  '/api/all/:id',
  params(object({ id: and(string, length(10)) })),
  query(object({ sort: oneOf('ASC' as const, 'DESC' as const) })),
  body(
    object({
      name: and(string, minLength(1)),
      car: or(nullish, and(integer, min(1), max(99)))
    })
  ),
  (req, res) => {
    res.json({
      params: {
        id: req.params.id
      },
      query: {
        sort: req.query.sort
      },
      body: {
        name: req.body.name,
        car: req.body.car
      }
    });
  }
);

app.use(errorLogger);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
