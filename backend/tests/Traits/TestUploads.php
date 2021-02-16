<?php

namespace Tests\Traits;

use App\Models\Traits\UploadFiles;
use Illuminate\Http\UploadedFile;
use App\Models\Video;
use Illuminate\Foundation\Testing\TestResponse;

trait TestUploads
{
  protected function assertInvalidationFile($field, $extension, $maxSize, $rule, $ruleParams = [])
  {
    $routes = [
      [
        'method' => 'POST',
        'route' => $this->routeStore()
      ],
      [
        'method' => 'PUT',
        'route' => $this->routeUpdate()
      ],
    ];

    foreach($routes as $route)
    {
      $file = UploadedFile::fake()->create("$field.$extension");
      $response = $this->json($route['method'], $route['route'], [ $field => $field]);

      $this->assertInvalidationFields($response, [$field], $rule, $ruleParams);

      $file = UploadedFile::fake()->create("$field.$extension")->size($maxSize + 1);
      $response = $this->json($route['method'], $route['route'], [ $field => $file]);

      $this->assertInvalidationFields($response, [$field], 'max.file', ['max' => $maxSize]);
    }
  }
  
  protected function assertFilesExistsInStorage($model, array $files){
    foreach( $files as $file){
      \Storage::assertExists($model->relativeFilePath($file->hashName()));
    }
  }

  protected function assertIfFilesUrlExists(Video $video, TestResponse $response)
    {
        $fileFields = Video::$fileFields;
        $data = $response->json('data');
        $data = array_key_exists(0, $data) ? $data[0]: $data;
        foreach($fileFields as $field){
            $file = $video->{$field};
            $this->assertEquals(
                \Storage::url($video->relativeFilePath($file)),
                $data[$field . '_url']
            );
        }
    }
}