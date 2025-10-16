<?php

namespace App\Services;

class SmsService
{
    /* Constants */
    const URL = 'gw.barabut.com';
    const USE_HTTPS = false;
    const DEBUG = false;

    private string $username;
    private string $password;
    private string $from = '';
    private string $scheduled_delivery_time = '';
    private int $validity_period = 1440;
    private string $data_coding = 'Default';

    public function __construct(string $username, string $password)
    {
        $this->username = $username;
        $this->password = $password;
    }

    public function submit(array $toList, string $message, ?string $from = null, ?string $scheduled_delivery_time = null, ?int $validity_period = null, ?string $data_coding = null): SmsApiResponse
    {
        if (count($toList) == 0) {
            return new SmsApiResponse(false, 'Enter at least one cell phone number');
        }

        if (trim($message) == '') {
            return new SmsApiResponse(false, 'Message text is empty.');
        }

        $this->checkMessageHeader($from, $scheduled_delivery_time, $validity_period, $data_coding);

        $writer = $this->startDocument("Submit");
        $this->writeCredential($writer);
        $this->writeDataCoding($writer);
        $this->writeHeader($writer);
        $this->writeMessage($writer, $message, $toList);
        $xml = $this->endDocument($writer);

        $response = $this->httpPost("Submit", $xml);

        if (self::DEBUG) {
            // Basic logging, replace with a proper logger like Monolog if needed
            error_log("SMS API XML: " . $xml);
            error_log("SMS API Response Status: " . ($response->status ? 'Success' : 'Failure') . " - " . $response->error);
        }

        return $response;
    }

    // Keeping other public methods like submitData, query, etc. for completeness,
    // but refactoring only the `submit` method for now. The rest can be adapted similarly if needed.

    private function checkMessageHeader(?string $from, ?string $scheduled_delivery_time, ?int $validity_period, ?string $data_coding): void
    {
        if ($from !== null) {
            $this->from = $from;
        }
        if ($scheduled_delivery_time !== null) {
            $this->scheduled_delivery_time = $scheduled_delivery_time;
        }
        if ($validity_period !== null) {
            $this->validity_period = $validity_period;
        }
        if ($data_coding !== null) {
            $this->data_coding = $data_coding;
        }
    }

    private function httpPost(string $action, string $content): SmsApiResponse
    {
        $protocol = self::USE_HTTPS ? 'https' : 'http';
        $url = $protocol . '://' . self::URL . '/v2/' . $action;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/xml']);
        
        $responseContent = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);

        $response = new SmsApiResponse();

        if ($curl_error) {
            $response->status = false;
            $response->error = 'Curl error: ' . $curl_error;
            return $response;
        }

        if ($http_code != 200) {
            $response->status = false;
            $response->error = 'HTTP error: ' . $http_code . ' - ' . $responseContent;
            return $response;
        }
        
        $response->status = true;
        $response->payload = simplexml_load_string($responseContent);
        
        return $response;
    }
    
    // Minimal refactoring of XML writing methods for clarity
    private function startDocument(string $rootName): \XMLWriter
    {
        $writer = new \XMLWriter();
        $writer->openMemory();
        $writer->startDocument('1.0', 'UTF-8');
        $writer->startElement($root_name);
        return $writer;
    }

    private function endDocument(\XMLWriter $writer): string
    {
        $writer->endElement();
        $writer->endDocument();
        return $writer->outputMemory();
    }
    
    private function writeCredential(\XMLWriter $writer): void
    {
        $writer->startElement('Credential');
        $writer->writeElement('Username', $this->username);
        $writer->writeElement('Password', $this->password);
        $writer->endElement(); // Credential
    }
    
    private function writeHeader(\XMLWriter $writer): void
    {
		$writer->startElement('Header');
		$writer->writeElement('From', $this->from);
		if(!empty($this->scheduled_delivery_time)){
			$writer->writeElement('ScheduledDeliveryTime', $this->scheduled_delivery_time);
		}
		$writer->writeElement('ValidityPeriod', $this->validity_period);
		$writer->endElement(); // Header
    }
    
    private function writeDataCoding(\XMLWriter $writer): void
    {
        $writer->writeElement('DataCoding', $this->data_coding);
    }
    
    private function writeMessage(\XMLWriter $writer, string $message, array $toList): void
    {
        $writer->writeElement('Message', $message);
        $this->writeToList($writer, $toList);
    }

    private function writeToList(\XMLWriter $writer, array $toList): void
    {
        $writer->startElement('To');
        foreach ($toList as $to) {
            $writer->writeElement('Number', $to);
        }
        $writer->endElement(); // To
    }
}

class SmsApiResponse
{
    public bool $status;
    public ?string $error = null;
    public $payload = null;

    public function __construct(bool $status = false, ?string $error = null)
    {
        $this->status = $status;
        $this->error = $error;
    }
} 