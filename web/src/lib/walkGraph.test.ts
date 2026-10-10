import { describe, expect, it } from 'vitest';
import { buildWalkGraph, nearestNode, pathCoords, shortestPaths } from './walkGraph';

// Tre nodi in fila (0 - 1 - 2) e una scorciatoia lunga 0 - 2; l'arco 1-2 ha un punto intermedio
const raw = {
  origin: [12, 45] as [number, number],
  scale: 100_000,
  nodes: [0, 0, 100, 0, 200, 0],
  edges: [0, 1, 780, 0, 2, 1, 790, 1, 0, 2, 5000, 0],
  geom: [[], [150, 10], []],
};

describe('rete pedonale', () => {
  const g = buildWalkGraph(raw);

  it('percorso più breve e nodo più vicino', () => {
    const sp = shortestPaths(g, 0);
    expect(sp.dist[2]).toBeCloseTo(157, 0); // 78 + 79 m, non la scorciatoia da 500 m
    expect(nearestNode(g, 12.00101, 45).node).toBe(1);
  });

  it('il tracciato segue la geometria degli archi nel verso giusto, anche percorsi al contrario', () => {
    const forward = pathCoords(g, shortestPaths(g, 0), 2);
    expect(forward.map(([x]) => Math.round((x - 12) * 100_000))).toEqual([0, 100, 150, 200]);
    const backward = pathCoords(g, shortestPaths(g, 2), 0);
    expect(backward.map(([x]) => Math.round((x - 12) * 100_000))).toEqual([200, 150, 100, 0]);
  });

  it('i gradini sono segnati', () => {
    expect(Array.from(g.edgeFlags)).toEqual([0, 1, 0]);
  });
});
