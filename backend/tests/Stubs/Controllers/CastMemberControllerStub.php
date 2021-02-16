<?php

namespace Tests\Stubs\Controllers;

use App\Http\Controllers\Api\BasicCrudController;
use Tests\Stubs\Models\CastMemberStub;

class CastMemberControllerStub extends BasicCrudController
{
    protected function model()
    {
        return CastMemberStub::class;
    }

    protected function rulesStore()
    {
        return [
          'name' => 'required|max:255',
          'types' => 'required|numeric|between:1,2'
        ];
    }

    protected function rulesUpdate()
    {
        return [
            'name' => 'required|max:255',
            'types' => 'required|numeric|between:1,2'
        ];
    }
}
