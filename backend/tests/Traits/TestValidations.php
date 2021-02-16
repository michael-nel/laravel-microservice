<?php

declare(strict_types=1);

namespace Tests\Traits;

use Illuminate\Foundation\Testing\TestResponse;

trait TestValidations
{
    protected abstract function model();
    protected abstract function routeStore();
    protected abstract function routeUpdate();

    protected function assertInvalidationInStoreAction(
        array $data,
        string $rule,
        $ruleParams = []
    )
    {
        $response = $this->json('POST', $this->routeStore(),$data);
        $fields = array_keys($data);
        $this->assertInvalidationFields($response, $fields, $rule, $ruleParams );
    }

    protected function assertInvalidationInUpdateAction(
        array $data,
        string $rule,
        $ruleParams = []
    )
    {
        $response = $this->json('PUT', $this->routeUpdate(),$data);
        $fields = array_keys($data);
        $this->assertInvalidationFields($response, $fields, $rule, $ruleParams );
    }

    protected function assertInvalidationFields(TestResponse $response,
                                                array $fields,
                                                string $rule,
                                                array $ruleParams = [])
    {
        $response->assertStatus(422)
            ->assertJsonValidationErrors($fields);

        foreach($fields as $field){
            $fieldName = str_replace('_',' ',$field);
            $response->assertJsonFragment([
                \Lang::get( "validation.{$rule}", ['attribute' => $fieldName] + $ruleParams)
            ]);
        };
    }

    protected function isValidUuid($uuId)
    {
        if (!is_string($uuId) || (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $uuId) !== 1)) {
            return false;
        }
        return true;
    }

}
