import assert from 'node:assert/strict';
import { greetingForHour } from '../src/Greeting.tsx';
import { safeCapacity } from '../src/CapacityIndicator.tsx';
for (const [hour, expected] of [[0,'Good evening'],[4,'Good evening'],[5,'Good morning'],[11,'Good morning'],[12,'Good afternoon'],[17,'Good afternoon'],[18,'Good evening'],[23,'Good evening']] as const) assert.equal(greetingForHour(hour),expected);
for (const [value,expected] of [[-10,0],[0,0],[42,42],[100,100],[150,100],[NaN,0],[Infinity,0]]) assert.equal(safeCapacity(value),expected);
console.log('Passed 8 greeting boundary cases and 7 capacity range cases.');

import {recycleLocations, matchesFilter} from '../src/appData.tsx';
import {SIME_DARBY_COLLECTION_POINTS} from '../src/simeDarbyData.ts';
assert.equal(recycleLocations.length, SIME_DARBY_COLLECTION_POINTS.length);
assert.equal(new Set(recycleLocations.map(p=>p.id)).size,recycleLocations.length);
for (const point of SIME_DARBY_COLLECTION_POINTS) {
 const card=recycleLocations.find(p=>p.id===point.id)!;
 assert.equal(card.name,point.name);assert.equal(card.address,point.address);
 assert.equal(card.lat,point.lat);assert.equal(card.lng,point.lng);
}
assert.deepEqual(recycleLocations.filter(p=>matchesFilter(p,'General','All')).map(p=>p.id),SIME_DARBY_COLLECTION_POINTS.filter(p=>['General','Organic'].includes(p.category)).map(p=>p.id));
assert.deepEqual(recycleLocations.filter(p=>matchesFilter(p,'E-Waste','All')).map(p=>p.id),SIME_DARBY_COLLECTION_POINTS.filter(p=>p.category==='E-Waste').map(p=>p.id));
console.log('PASS: map/list identifiers, coordinates, addresses and General / E-Waste filter consistency.');
