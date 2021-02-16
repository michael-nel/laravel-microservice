<?php

namespace App\Observers;

use Bschmitt\Amqp\Message;
use Illuminate\Database\Eloquent\Model;

class SyncModelObserver
{
    public function created(Model $model)
    {
        $modelName = $this->getModelname($model);
        $data = $model->toArray();
        $action = __FUNCTION__;
        $routingKey = "model.{$modelName}.${action}";

        try {

            $this->publish($routingKey, $data);

        } catch( \Exception $exception) {
            $id = $model->id;
            $this->reportException([
                'modelName' => $modelName,
                'id' => $id,
                'action' => $action,
                'exception' => $exception
            ]);
        }
    }

    public function updated(Model $model)
    {
        $modelName = $this->getModelname($model);
        $data = $model->toArray();
        $action = __FUNCTION__;
        $routingKey = "model.{$modelName}.${action}";

        try {

            $this->publish($routingKey, $data);

        } catch( \Exception $exception) {
            $id = $model->id;
            $this->reportException([
                'modelName' => $modelName,
                'id' => $id,
                'action' => $action,
                'exception' => $exception
            ]);
        }
    }

    public function deleted(Model $model)
    {
        $modelName = $this->getModelname($model);
        $data = ['id' => $model->id];
        $action = __FUNCTION__;
        $routingKey = "model.{$modelName}.${action}";

        try {

            $this->publish($routingKey, $data);

        } catch( \Exception $exception) {
            $id = $model->id;
            $this->reportException([
                'modelName' => $modelName,
                'id' => $id,
                'action' => $action,
                'exception' => $exception
            ]);
        }
    }

    public function belongsToManyAttached($relatorion, $model, $ids) {
        $modelName = $this->getModelName($model);
        $relationName = \Str::snake($relatorion);
        $routingKey = "model.{$modelName}_{$relationName}.attached";
        $data = [
            'id' => $model->id,
            'relation_ids' => $ids
        ];

        try {
            $this->publish($routingKey, $data);
        } catch( \Exception $exception) {
            $id = $model->id;
            $this->reportException([
                'modelName' => $modelName,
                'id' => $id,
                'action' => 'attached',
                'exception' => $exception
            ]);
        }
    }

    public function restored(Model $model)
    {
        //
    }

    public function forceDeleted(Model $model)
    {
        //
    }

    protected function getModelName(Model $model)
    {
        $shortName = (new \ReflectionClass($model))->getShortName();

        return \Str::snake($shortName);
    }

    protected function publish($routingKey, array $data)
    {
        $message = new Message(
            json_encode($data),
            [
                'content_type' => 'application/json',
                'delivery_mode' => 2
            ]
        );

        \Amqp::publish(
            $routingKey,
            $message,
            [
                'exchange_type' => 'topic',
                'exchange' => 'amq.topic'
            ]
        );
    }

    protected function reportException(array $params){
        list(
            'modelName' => $modelName,
            'id' => $id,
            'action' => $action,
            'exception' => $exception
            ) = $params;
        $myException = new \Exception("The model $modelName with ID $id not synced on $action", 0, $exception);
        report($myException);
    }
}
