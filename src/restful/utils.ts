import { Model } from "@mongez/monpulse";
import { Request, Response } from "../http";
import { RepositoryManager } from "../repositories";

/**
 * Get resource by id
 */
export function getResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "record",
) {
  return async function _getResource(request: Request, response: Response) {
    const record = await repository.find(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    return response.success({
      [returnAs]: record,
    });
  };
}

/**
 * Get active resource by id
 */
export function getActiveResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "record",
) {
  return async function _getActiveResource(
    request: Request,
    response: Response,
  ) {
    const record = await repository.getActive(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    return response.success({
      [returnAs]: record,
    });
  };
}
/**
 * Get active cached resource by id
 */
export function getActiveCachedResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "record",
) {
  return async function _getActiveCachedResource(
    request: Request,
    response: Response,
  ) {
    const record = await repository.getActiveCached(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    return response.success({
      [returnAs]: record,
    });
  };
}

/**
 * Get owned resource by id
 */
export function getOwnedResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "record",
) {
  return async function _getOwnedResource(
    request: Request,
    response: Response,
  ) {
    const record = await repository.find(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    if (record.get("createdBy.id") !== request.user?.id) {
      return response.notFound();
    }

    return response.success({
      [returnAs]: record,
    });
  };
}

/**
 * Get owned active resource by id
 */
export function getOwnedActiveResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "record",
) {
  return async function _getOwnedActiveResource(
    request: Request,
    response: Response,
  ) {
    const record = await repository.getActive(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    if (record.get("createdBy.id") !== request.user?.id) {
      return response.notFound();
    }

    return response.success({
      [returnAs]: record,
    });
  };
}

/**
 * Return list of resources with pagination
 */
export function listResources<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "records",
) {
  return async function _listResources(request: Request, response: Response) {
    const { documents, paginationInfo } = await repository.list(request.all());

    return response.success({
      [returnAs]: documents,
      paginationInfo,
    });
  };
}

/**
 * Return list of active resources with pagination
 */
export function listActiveResources<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "records",
) {
  return async function _listActiveResources(
    request: Request,
    response: Response,
  ) {
    const { documents, paginationInfo } = await repository.listActive(
      request.all(),
    );

    return response.success({
      [returnAs]: documents,
      paginationInfo,
    });
  };
}

/**
 * Return list of active cached resources with pagination
 */
export function listActiveCachedResources<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "records",
) {
  return async function _listActiveCachedResources(
    request: Request,
    response: Response,
  ) {
    const { documents, paginationInfo } = await repository.listActiveCached(
      request.all(),
    );

    return response.success({
      [returnAs]: documents,
      paginationInfo,
    });
  };
}

/**
 * Return list of owned resources with pagination
 */
export function listOwnedResources<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "records",
) {
  return async function _listOwnedResources(
    request: Request,
    response: Response,
  ) {
    const { documents, paginationInfo } = await repository.listOwned(
      request.all(),
    );

    return response.success({
      [returnAs]: documents,
      paginationInfo,
    });
  };
}

/**
 * Return list of owned active resources with pagination
 */
export function listOwnedActiveResources<T extends Model = Model>(
  repository: RepositoryManager<T>,
  returnAs = "records",
) {
  return async function _listOwnedActiveResources(
    request: Request,
    response: Response,
  ) {
    const { documents, paginationInfo } = await repository.listOwnedActive(
      request.all(),
    );

    return response.success({
      [returnAs]: documents,
      paginationInfo,
    });
  };
}

/**
 * Create resource
 */
export function createResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
  rules: any,
  returnAs = "record",
) {
  async function _createResource(request: Request, response: Response) {
    const record = await repository.create(request.all());

    return response.success({
      [returnAs]: record,
    });
  }

  _createResource.validation = {
    rules,
  };

  return _createResource;
}

/**
 * Update resource
 */
export function updateResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
  rules: any,
  returnAs = "record",
) {
  async function _updateResource(request: Request, response: Response) {
    const record = await repository.find(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    repository.update(record.id, request.all());

    return response.success({
      [returnAs]: record,
    });
  }

  _updateResource.validation = {
    rules,
  };

  return _updateResource;
}

/**
 * Update active resource
 */
export function updateActiveResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
  rules: any,
  returnAs = "record",
) {
  async function _updateActiveResource(request: Request, response: Response) {
    const record = await repository.getActive(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    repository.update(record.id, request.all());

    return response.success({
      [returnAs]: record,
    });
  }

  _updateActiveResource.validation = {
    rules,
  };

  return _updateActiveResource;
}

/**
 * Delete resource
 */
export function deleteResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
) {
  return async function _deleteResource(request: Request, response: Response) {
    const record = await repository.find(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    repository.delete(record.id);

    return response.success();
  };
}

/**
 * Delete active resource
 */
export function deleteActiveResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
) {
  return async function _deleteActiveResource(
    request: Request,
    response: Response,
  ) {
    const record = await repository.getActive(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    repository.delete(record.id);

    return response.success();
  };
}

/**
 * Deleted owned resource
 */
export function deleteOwnedResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
) {
  return async function _deleteOwnedResource(
    request: Request,
    response: Response,
  ) {
    const record = await repository.find(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    if (record.get("createdBy.id") !== request.user?.id) {
      return response.notFound();
    }

    repository.delete(record.id);

    return response.success();
  };
}

/**
 * Deleted owned active resource
 */
export function deleteOwnedActiveResource<T extends Model = Model>(
  repository: RepositoryManager<T>,
) {
  return async function _deleteOwnedActiveResource(
    request: Request,
    response: Response,
  ) {
    const record = await repository.getActive(request.input("id"));

    if (!record) {
      return response.notFound();
    }

    if (record.get("createdBy.id") !== request.user?.id) {
      return response.notFound();
    }

    repository.delete(record.id);

    return response.success();
  };
}
