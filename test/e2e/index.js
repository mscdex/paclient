
import test from 'ava';

import pify from 'pify';

import PAClient from '../../';

const indexComparator = (a, b) => a.index - b.index;

test.beforeEach(t => {
  const pa = new PAClient();
  const connect = () => {
    pa.connect();
    return new Promise(resolve => pa.once('ready', resolve));
  };

  Object.assign(t.context, {
    pa,
    connect,
  });
});

test.afterEach(t => {
  const { pa } = t.context;
  pa.end();
});

test.serial('connection', async t => {
  const { connect } = t.context;
  await connect();
  t.pass();
});

test.serial('moveSourceOutput (index, index)', async t => {
  const { pa, connect } = t.context;
  await connect();

  const sourceOutputs = await pify(pa).getSourceOutputs();
  const sourceOutput = sourceOutputs.find(so => so.sourceIndex >= 0);
  await pify(pa).moveSourceOutput(sourceOutput.index, sourceOutput.sourceIndex);

  t.pass();
});

test.serial('moveSourceOutput (index, name)', async t => {
  const { pa, connect } = t.context;
  await connect();

  const sourceOutputs = await pify(pa).getSourceOutputs();
  const sources = await pify(pa).getSources();
  const sourceOutput = sourceOutputs.find(so => so.sourceIndex >= 0);
  const source = sources.find(s => s.index === sourceOutput.sourceIndex);
  await pify(pa).moveSourceOutput(sourceOutput.index, source.name);

  t.pass();
});

test.serial('setSinkPort (name, name)', async t => {
  const { pa, connect } = t.context;
  await connect();

  const sinks = await pify(pa).getSinks();
  const sink = sinks.find(s => s.ports.length > 0);
  const { activePortName } = sink;
  await pify(pa).setSinkPort(sink.name, activePortName);

  t.pass();
});

test.serial('loadModule + unloadModuleByIndex', async t => {
  const { pa, connect } = t.context;
  await connect();

  const modulesBefore = (await pify(pa).getModules()).sort(indexComparator);
  await pify(pa).loadModule('module-null-sink', '');
  const modulesAfter = (await pify(pa).getModules()).sort(indexComparator);

  t.is(modulesAfter.length, modulesBefore.length + 1);

  const lastModule = modulesAfter[modulesAfter.length - 1];

  t.is(lastModule.name, 'module-null-sink');

  await pify(pa).unloadModuleByIndex(lastModule.index);

  const modulesAfterKill = (await pify(pa).getModules()).sort(indexComparator);

  t.deepEqual(modulesAfterKill, modulesBefore);
});
