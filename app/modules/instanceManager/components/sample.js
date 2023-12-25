import SampleCreator from './sample/creator';
import SampleRemover from './sample/remover';
import SampleReCreator from './sample/reCreator';

export function create(instanceId, alias) {
	const creator = new SampleCreator(instanceId, alias);
	return creator.create();
}

export function remove(alias) {
	const remover = new SampleRemover(alias);
	return remover.remove();
}

export function reCreate() {
	const reCreator = new SampleReCreator();
	return reCreator.reCreate();
}